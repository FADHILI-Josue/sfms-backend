import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { FacilityEntity } from './entities/facility.entity';
import { CreateFacilityDto } from './dto/create-facility.dto';
import { UpdateFacilityDto } from './dto/update-facility.dto';

@Injectable()
export class FacilitiesService {
  constructor(
    @InjectRepository(FacilityEntity)
    private readonly facilities: Repository<FacilityEntity>,
  ) {}

  list() {
    return this.facilities.find({ order: { createdAt: 'DESC' } });
  }

  async get(id: string) {
    const facility = await this.facilities.findOne({ where: { id } });
    if (!facility) throw new NotFoundException('Facility not found.');
    return facility;
  }

  create(dto: CreateFacilityDto) {
    const facility = this.facilities.create({
      name: dto.name,
      type: dto.type,
      supportedSports: dto.supportedSports ?? [],
      dimensions: dto.dimensions ?? null,
      maxCapacity: dto.maxCapacity ?? null,
      status: dto.status,
      nextMaintenanceAt: dto.nextMaintenanceAt ?? null,
      peakRateCents: dto.peakRateCents ?? null,
      offPeakRateCents: dto.offPeakRateCents ?? null,
    });

    return this.facilities.save(facility);
  }

  async update(id: string, dto: UpdateFacilityDto) {
    const facility = await this.get(id);

    if (dto.name !== undefined) facility.name = dto.name;
    if (dto.type !== undefined) facility.type = dto.type;
    if (dto.supportedSports !== undefined) facility.supportedSports = dto.supportedSports;
    if (dto.dimensions !== undefined) facility.dimensions = dto.dimensions ?? null;
    if (dto.maxCapacity !== undefined) facility.maxCapacity = dto.maxCapacity ?? null;
    if (dto.status !== undefined) facility.status = dto.status;
    if (dto.nextMaintenanceAt !== undefined) facility.nextMaintenanceAt = dto.nextMaintenanceAt ?? null;
    if (dto.peakRateCents !== undefined) facility.peakRateCents = dto.peakRateCents ?? null;
    if (dto.offPeakRateCents !== undefined) facility.offPeakRateCents = dto.offPeakRateCents ?? null;

    return this.facilities.save(facility);
  }

  async delete(id: string) {
    await this.get(id);
    await this.facilities.delete({ id });
    return { ok: true };
  }
}

