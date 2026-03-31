import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';

import { FacilityEntity } from '../facilities/entities/facility.entity';
import { MemberEntity } from '../memberships/entities/member.entity';
import { BookingEntity } from './entities/booking.entity';
import { BookingStatus } from './booking.enums';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';

@Injectable()
export class BookingsService {
  constructor(
    @InjectRepository(BookingEntity) private readonly bookings: Repository<BookingEntity>,
    @InjectRepository(FacilityEntity) private readonly facilities: Repository<FacilityEntity>,
    @InjectRepository(MemberEntity) private readonly members: Repository<MemberEntity>,
  ) {}

  list() {
    return this.bookings.find({ order: { startAt: 'DESC' } });
  }

  async get(id: string) {
    const booking = await this.bookings.findOne({ where: { id } });
    if (!booking) throw new NotFoundException('Booking not found.');
    return booking;
  }

  async create(dto: CreateBookingDto) {
    await this.assertFacilityAndMember(dto.facilityId, dto.memberId);
    this.assertValidInterval(dto.startAt, dto.endAt);
    await this.assertNoConflict(dto.facilityId, dto.startAt, dto.endAt);

    const booking = this.bookings.create({
      facilityId: dto.facilityId,
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

  async update(id: string, dto: UpdateBookingDto) {
    const booking = await this.get(id);

    const facilityId = dto.facilityId ?? booking.facilityId;
    const memberId = dto.memberId ?? booking.memberId;
    const startAt = dto.startAt ?? booking.startAt;
    const endAt = dto.endAt ?? booking.endAt;

    await this.assertFacilityAndMember(facilityId, memberId);
    this.assertValidInterval(startAt, endAt);
    await this.assertNoConflict(facilityId, startAt, endAt, booking.id);

    if (dto.facilityId !== undefined) booking.facilityId = dto.facilityId;
    if (dto.memberId !== undefined) booking.memberId = dto.memberId;
    if (dto.type !== undefined) booking.type = dto.type;
    if (dto.status !== undefined) booking.status = dto.status;
    if (dto.startAt !== undefined) booking.startAt = dto.startAt;
    if (dto.endAt !== undefined) booking.endAt = dto.endAt;
    if (dto.recurrence !== undefined) booking.recurrence = dto.recurrence;
    if (dto.notes !== undefined) booking.notes = dto.notes ?? null;

    return this.bookings.save(booking);
  }

  async delete(id: string) {
    await this.get(id);
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

  private async assertNoConflict(
    facilityId: string,
    startAt: Date,
    endAt: Date,
    excludeBookingId?: string,
  ) {
    const where: any = {
      facilityId,
      status: Not(BookingStatus.CANCELLED),
    };
    if (excludeBookingId) where.id = Not(excludeBookingId);

    // Overlap condition: existing.start < end AND existing.end > start
    const conflict = await this.bookings
      .createQueryBuilder('b')
      .where('b.facilityId = :facilityId', { facilityId })
      .andWhere('b.status != :cancelled', { cancelled: BookingStatus.CANCELLED })
      .andWhere(excludeBookingId ? 'b.id != :id' : '1=1', { id: excludeBookingId })
      .andWhere('b.startAt < :endAt AND b.endAt > :startAt', { startAt, endAt })
      .getOne();

    if (conflict) {
      throw new ConflictException('Facility is already booked for the selected time.');
    }
  }
}

