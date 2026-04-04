import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Not, Repository } from 'typeorm';

import { CourtEntity } from '../facilities/entities/court.entity';
import { FacilityEntity } from '../facilities/entities/facility.entity';
import { FacilityAccessService } from '../facilities/facility-access.service';
import { MemberEntity } from '../memberships/entities/member.entity';
import { BookingEntity } from './entities/booking.entity';
import { BookingStatus } from './booking.enums';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import type { AuthUser } from '../auth/types/auth-user.type';

@Injectable()
export class BookingsService {
  constructor(
    @InjectRepository(BookingEntity) private readonly bookings: Repository<BookingEntity>,
    @InjectRepository(FacilityEntity) private readonly facilities: Repository<FacilityEntity>,
    @InjectRepository(CourtEntity) private readonly courts: Repository<CourtEntity>,
    @InjectRepository(MemberEntity) private readonly members: Repository<MemberEntity>,
    private readonly access: FacilityAccessService,
  ) {}

  async list(user: AuthUser) {
    if (this.access.isSuperAdmin(user)) {
      return this.bookings.find({
        order: { startAt: 'DESC' },
        relations: { facility: true, member: true, court: true } as any,
        take: 500,
      });
    }

    const scope = await this.access.getScope(user);
    if (scope.facilityIds.length === 0) return [];

    const items = await this.bookings.find({
      where: { facilityId: In(scope.facilityIds) },
      order: { startAt: 'DESC' },
      relations: { facility: true, member: true, court: true } as any,
      take: 500,
    });

    return items.filter((b) => {
      const allowedCourtIds = scope.courtIdsByFacilityId[b.facilityId];
      if (allowedCourtIds == null) return true;
      if (!b.courtId) return false;
      return allowedCourtIds.includes(b.courtId);
    });
  }

  async get(user: AuthUser, id: string) {
    const booking = await this.bookings.findOne({
      where: { id },
      relations: { facility: true, member: true, court: true } as any,
    });
    if (!booking) throw new NotFoundException('Booking not found.');

    if (!this.access.isSuperAdmin(user)) {
      const scope = await this.access.getScope(user);
      if (!scope.facilityIds.includes(booking.facilityId)) throw new NotFoundException('Booking not found.');
      const allowedCourtIds = scope.courtIdsByFacilityId[booking.facilityId];
      if (allowedCourtIds != null) {
        if (!booking.courtId) throw new NotFoundException('Booking not found.');
        if (!allowedCourtIds.includes(booking.courtId)) throw new NotFoundException('Booking not found.');
      }
    }

    return booking;
  }

  async create(user: AuthUser, dto: CreateBookingDto) {
    if (!this.access.isSuperAdmin(user)) {
      const visible = await this.access.assertFacilityIdsVisible(user, [dto.facilityId]);
      if (!visible) throw new BadRequestException('Facility not found.');
      const scope = await this.access.getScope(user);
      const allowedCourtIds = scope.courtIdsByFacilityId[dto.facilityId];
      if (allowedCourtIds != null) {
        if (!dto.courtId) throw new BadRequestException('courtId is required for your account scope.');
        if (!allowedCourtIds.includes(dto.courtId)) throw new BadRequestException('Court not found.');
      }
    }

    await this.assertFacilityMemberAndCourt(dto.facilityId, dto.memberId, dto.courtId);
    this.assertValidInterval(dto.startAt, dto.endAt);
    await this.assertNoConflict(
      { facilityId: dto.facilityId, courtId: dto.courtId ?? null },
      dto.startAt,
      dto.endAt,
    );

    const booking = this.bookings.create({
      facilityId: dto.facilityId,
      courtId: dto.courtId ?? null,
      memberId: dto.memberId,
      type: dto.type,
      status: dto.status ?? BookingStatus.PENDING,
      startAt: dto.startAt,
      endAt: dto.endAt,
      recurrence: dto.recurrence,
      notes: dto.notes ?? null,
    });

    return this.bookings.save(booking);
  }

  async update(user: AuthUser, id: string, dto: UpdateBookingDto) {
    const booking = await this.get(user, id);

    const facilityId = dto.facilityId ?? booking.facilityId;
    const memberId = dto.memberId ?? booking.memberId;
    const courtId = dto.courtId ?? booking.courtId ?? null;
    const startAt = dto.startAt ?? booking.startAt;
    const endAt = dto.endAt ?? booking.endAt;

    await this.assertFacilityMemberAndCourt(facilityId, memberId, courtId ?? undefined);
    this.assertValidInterval(startAt, endAt);
    await this.assertNoConflict({ facilityId, courtId }, startAt, endAt, booking.id);

    if (dto.facilityId !== undefined) booking.facilityId = dto.facilityId;
    if (dto.courtId !== undefined) booking.courtId = dto.courtId ?? null;
    if (dto.memberId !== undefined) booking.memberId = dto.memberId;
    if (dto.type !== undefined) booking.type = dto.type;
    if (dto.status !== undefined) booking.status = dto.status;
    if (dto.startAt !== undefined) booking.startAt = dto.startAt;
    if (dto.endAt !== undefined) booking.endAt = dto.endAt;
    if (dto.recurrence !== undefined) booking.recurrence = dto.recurrence;
    if (dto.notes !== undefined) booking.notes = dto.notes ?? null;

    return this.bookings.save(booking);
  }

  async delete(user: AuthUser, id: string) {
    await this.get(user, id);
    await this.bookings.delete({ id });
    return { ok: true };
  }

  private assertValidInterval(startAt: Date, endAt: Date) {
    if (!(startAt instanceof Date) || Number.isNaN(startAt.getTime())) {
      throw new BadRequestException('Invalid startAt.');
    }
    if (!(endAt instanceof Date) || Number.isNaN(endAt.getTime())) {
      throw new BadRequestException('Invalid endAt.');
    }
    if (endAt <= startAt) throw new BadRequestException('endAt must be after startAt.');
  }

  private async assertFacilityAndMember(facilityId: string, memberId: string) {
    const [facilityOk, memberOk] = await Promise.all([
      this.facilities.exist({ where: { id: facilityId } }),
      this.members.exist({ where: { id: memberId } }),
    ]);
    if (!facilityOk) throw new BadRequestException('Facility not found.');
    if (!memberOk) throw new BadRequestException('Member not found.');
  }

  private async assertFacilityMemberAndCourt(
    facilityId: string,
    memberId: string,
    courtId?: string,
  ) {
    await this.assertFacilityAndMember(facilityId, memberId);
    if (!courtId) return;

    const courtOk = await this.courts.exist({ where: { id: courtId, facilityId, isActive: true } });
    if (!courtOk) throw new BadRequestException('Court not found.');
  }

  private async assertNoConflict(
    scope: { facilityId: string; courtId: string | null },
    startAt: Date,
    endAt: Date,
    excludeBookingId?: string,
  ) {
    // Overlap condition: existing.start < end AND existing.end > start
    const conflict = await this.bookings
      .createQueryBuilder('b')
      .where('b.facilityId = :facilityId', { facilityId: scope.facilityId })
      .andWhere('b.status != :cancelled', { cancelled: BookingStatus.CANCELLED })
      .andWhere(excludeBookingId ? 'b.id != :id' : '1=1', { id: excludeBookingId })
      .andWhere(
        scope.courtId ? '(b.courtId = :courtId OR b.courtId IS NULL)' : '1=1',
        { courtId: scope.courtId },
      )
      .andWhere('b.startAt < :endAt AND b.endAt > :startAt', { startAt, endAt })
      .getOne();

    if (conflict) {
      throw new ConflictException(
        scope.courtId
          ? 'Court is already booked for the selected time.'
          : 'Facility is already booked for the selected time.',
      );
    }
  }
}
