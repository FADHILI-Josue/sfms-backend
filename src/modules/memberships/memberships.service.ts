import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { FacilityEntity } from '../facilities/entities/facility.entity';
import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { MemberEntity } from './entities/member.entity';

@Injectable()
export class MembershipsService {
  constructor(
    @InjectRepository(MemberEntity) private readonly members: Repository<MemberEntity>,
    @InjectRepository(FacilityEntity) private readonly facilities: Repository<FacilityEntity>,
  ) {}

  list() {
    return this.members.find({ order: { createdAt: 'DESC' } });
  }

  async get(id: string) {
    const member = await this.members.findOne({ where: { id } });
    if (!member) throw new NotFoundException('Member not found.');
    return member;
  }

  async create(dto: CreateMemberDto) {
    if (dto.facilityId) {
      const exists = await this.facilities.exist({ where: { id: dto.facilityId } });
      if (!exists) throw new BadRequestException('Facility not found.');
    }

    const member = this.members.create({
      name: dto.name,
      category: dto.category,
      sport: dto.sport,
      status: dto.status,
      plan: dto.plan,
      memberCount: dto.memberCount ?? 1,
      joinedAt: dto.joinedAt ?? null,
      digitalCardId: dto.digitalCardId ?? null,
      facilityId: dto.facilityId ?? null,
    });

    return this.members.save(member);
  }

  async update(id: string, dto: UpdateMemberDto) {
    const member = await this.get(id);

    if (dto.facilityId !== undefined && dto.facilityId) {
      const exists = await this.facilities.exist({ where: { id: dto.facilityId } });
      if (!exists) throw new BadRequestException('Facility not found.');
    }

    if (dto.name !== undefined) member.name = dto.name;
    if (dto.category !== undefined) member.category = dto.category;
    if (dto.sport !== undefined) member.sport = dto.sport;
    if (dto.status !== undefined) member.status = dto.status;
    if (dto.plan !== undefined) member.plan = dto.plan;
    if (dto.memberCount !== undefined) member.memberCount = dto.memberCount ?? 1;
    if (dto.joinedAt !== undefined) member.joinedAt = dto.joinedAt ?? null;
    if (dto.digitalCardId !== undefined) member.digitalCardId = dto.digitalCardId ?? null;
    if (dto.facilityId !== undefined) member.facilityId = dto.facilityId ?? null;

    return this.members.save(member);
  }

  async delete(id: string) {
    await this.get(id);
    await this.members.delete({ id });
    return { ok: true };
  }
}

