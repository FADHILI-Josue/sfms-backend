import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import type { AuthUser } from '../auth/types/auth-user.type';
import { FacilityAccessService } from './facility-access.service';
import { CourtEntity } from './entities/court.entity';
import { FacilityEntity } from './entities/facility.entity';
import { CreateCourtDto } from './dto/create-court.dto';
import { UpdateCourtDto } from './dto/update-court.dto';

@Injectable()
export class CourtsService {
  constructor(
    @InjectRepository(CourtEntity) private readonly courts: Repository<CourtEntity>,
    @InjectRepository(FacilityEntity) private readonly facilities: Repository<FacilityEntity>,
    private readonly access: FacilityAccessService,
  ) {}

  async listForFacility(user: AuthUser, facilityId: string) {
    if (!this.access.isSuperAdmin(user)) {
      const visible = await this.access.assertFacilityIdsVisible(user, [facilityId]);
      if (!visible) throw new NotFoundException('Facility not found.');
    }

    return this.courts.find({ where: { facilityId }, order: { name: 'ASC' } });
  }

  async listPublicForFacility(facilityId: string) {
    return this.courts.find({ where: { facilityId, isActive: true }, order: { name: 'ASC' } });
  }

  async create(user: AuthUser, facilityId: string, dto: CreateCourtDto) {
    if (!this.access.isSuperAdmin(user)) {
      const visible = await this.access.assertFacilityIdsVisible(user, [facilityId]);
      if (!visible) throw new NotFoundException('Facility not found.');
    }

    const facilityOk = await this.facilities.exist({ where: { id: facilityId } });
    if (!facilityOk) throw new BadRequestException('Facility not found.');

    const court = this.courts.create({
      facilityId,
      name: dto.name,
      supportedSports: dto.supportedSports ?? [],
      isActive: dto.isActive ?? true,
      dimensions: dto.dimensions ?? null,
      maxCapacity: dto.maxCapacity ?? null,
      peakRateCents: dto.peakRateCents ?? null,
      offPeakRateCents: dto.offPeakRateCents ?? null,
      mainImage: dto.mainImage ?? null,
      metadata: dto.metadata ?? null,
    });
    return this.courts.save(court);
  }

  async get(user: AuthUser, id: string) {
    const court = await this.courts.findOne({ where: { id } });
    if (!court) throw new NotFoundException('Court not found.');
    if (!this.access.isSuperAdmin(user)) {
      const visible = await this.access.assertFacilityIdsVisible(user, [court.facilityId]);
      if (!visible) throw new NotFoundException('Court not found.');
    }
    return court;
  }

  async update(user: AuthUser, id: string, dto: UpdateCourtDto) {
    const court = await this.get(user, id);

    if (dto.name !== undefined) court.name = dto.name;
    if (dto.supportedSports !== undefined) court.supportedSports = dto.supportedSports;
    if (dto.isActive !== undefined) court.isActive = dto.isActive;
    if (dto.dimensions !== undefined) court.dimensions = dto.dimensions ?? null;
    if (dto.maxCapacity !== undefined) court.maxCapacity = dto.maxCapacity ?? null;
    if (dto.peakRateCents !== undefined) court.peakRateCents = dto.peakRateCents ?? null;
    if (dto.offPeakRateCents !== undefined) court.offPeakRateCents = dto.offPeakRateCents ?? null;
    if (dto.mainImage !== undefined) court.mainImage = dto.mainImage ?? null;
    if (dto.metadata !== undefined) court.metadata = dto.metadata ?? null;

    return this.courts.save(court);
  }

  async delete(user: AuthUser, id: string) {
    await this.get(user, id);
    await this.courts.delete({ id });
    return { ok: true };
  }
}

