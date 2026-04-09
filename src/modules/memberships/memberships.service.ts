import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import type { AuthUser } from '../auth/types/auth-user.type';
import { FacilityAccessService } from '../facilities/facility-access.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { AuditCategory, AuditSeverity } from '../audit-logs/audit.enums';
import { FacilityEntity } from '../facilities/entities/facility.entity';
import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { MemberEntity } from './entities/member.entity';

@Injectable()
export class MembershipsService {
  constructor(
    @InjectRepository(MemberEntity) private readonly members: Repository<MemberEntity>,
    @InjectRepository(FacilityEntity) private readonly facilities: Repository<FacilityEntity>,
    private readonly access: FacilityAccessService,
    private readonly audit: AuditLogsService,
  ) {}

  async list(user: AuthUser, facilityId?: string) {
    if (this.access.isSuperAdmin(user)) {
      return this.members.find({
        where: facilityId ? { facilityId } : undefined,
        order: { createdAt: 'DESC' },
        relations: { facility: true } as any,
        take: 500,
      });
    }

    const scope = await this.access.getScope(user);
    if (scope.facilityIds.length === 0) return [];

    const targetIds = facilityId
      ? scope.facilityIds.filter((id) => id === facilityId)
      : scope.facilityIds;

    if (targetIds.length === 0) return [];

    return this.members.find({
      where: { facilityId: In(targetIds) },
      order: { createdAt: 'DESC' },
      relations: { facility: true } as any,
      take: 500,
    });
  }

  async get(user: AuthUser, id: string) {
    const member = await this.members.findOne({ where: { id }, relations: { facility: true } as any });
    if (!member) throw new NotFoundException('Member not found.');

    if (!this.access.isSuperAdmin(user)) {
      if (!member.facilityId) throw new NotFoundException('Member not found.');
      const scope = await this.access.getScope(user);
      if (!scope.facilityIds.includes(member.facilityId)) throw new NotFoundException('Member not found.');
    }

    return member;
  }

  async create(user: AuthUser, dto: CreateMemberDto) {
    if (dto.facilityId) {
      const exists = await this.facilities.exist({ where: { id: dto.facilityId } });
      if (!exists) throw new BadRequestException('Facility not found.');
      if (!this.access.isSuperAdmin(user)) {
        const visible = await this.access.assertFacilityIdsVisible(user, [dto.facilityId]);
        if (!visible) throw new BadRequestException('Facility not found.');
      }
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

    const saved = await this.members.save(member);
    void this.audit.record({
      action: 'MEMBER_CREATED',
      category: AuditCategory.MEMBER,
      actorId: user.id,
      actorName: user.fullName,
      targetType: 'Member',
      targetId: saved.id,
      details: { name: dto.name, category: dto.category, sport: dto.sport, facilityId: dto.facilityId },
    });
    return saved;
  }

  async update(user: AuthUser, id: string, dto: UpdateMemberDto) {
    const member = await this.get(user, id);

    if (dto.facilityId !== undefined && dto.facilityId) {
      const exists = await this.facilities.exist({ where: { id: dto.facilityId } });
      if (!exists) throw new BadRequestException('Facility not found.');
      if (!this.access.isSuperAdmin(user)) {
        const visible = await this.access.assertFacilityIdsVisible(user, [dto.facilityId]);
        if (!visible) throw new BadRequestException('Facility not found.');
      }
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

    const updated = await this.members.save(member);
    void this.audit.record({
      action: 'MEMBER_UPDATED',
      category: AuditCategory.MEMBER,
      actorId: user.id,
      actorName: user.fullName,
      targetType: 'Member',
      targetId: id,
      details: { changes: Object.keys(dto) },
    });
    return updated;
  }

  async delete(user: AuthUser, id: string) {
    await this.get(user, id);
    await this.members.delete({ id });
    void this.audit.record({
      action: 'MEMBER_DELETED',
      category: AuditCategory.MEMBER,
      severity: AuditSeverity.WARNING,
      actorId: user.id,
      actorName: user.fullName,
      targetType: 'Member',
      targetId: id,
    });
    return { ok: true };
  }
}
