import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import type { AuthUser } from '../auth/types/auth-user.type';
import { FacilityAccessService } from '../facilities/facility-access.service';
import { MembershipPlanEntity } from './entities/membership-plan.entity';

@Injectable()
export class MembershipPlansService {
  constructor(
    @InjectRepository(MembershipPlanEntity) private readonly plans: Repository<MembershipPlanEntity>,
    private readonly access: FacilityAccessService,
  ) {}

  async listByFacility(facilityId: string): Promise<MembershipPlanEntity[]> {
    return this.plans.find({
      where: { facilityId },
      order: { sortOrder: 'ASC', createdAt: 'ASC' },
    });
  }

  async listForUser(user: AuthUser, facilityId?: string): Promise<MembershipPlanEntity[]> {
    if (this.access.isSuperAdmin(user)) {
      return this.plans.find({
        where: facilityId ? { facilityId } : undefined,
        order: { sortOrder: 'ASC', createdAt: 'ASC' },
        take: 500,
      });
    }
    const scope = await this.access.getScope(user);
    const ids = facilityId
      ? scope.facilityIds.filter((id) => id === facilityId)
      : scope.facilityIds;
    if (ids.length === 0) return [];
    return this.plans.find({
      where: ids.map((id) => ({ facilityId: id })),
      order: { sortOrder: 'ASC', createdAt: 'ASC' },
      take: 500,
    });
  }

  async create(user: AuthUser, dto: any): Promise<MembershipPlanEntity> {
    if (!dto.facilityId) throw new BadRequestException('facilityId is required');
    if (!this.access.isSuperAdmin(user)) {
      const scope = await this.access.getScope(user);
      if (!scope.facilityIds.includes(dto.facilityId))
        throw new BadRequestException('Facility not found.');
    }
    const plan = this.plans.create({
      facilityId: dto.facilityId,
      name: dto.name,
      description: dto.description ?? null,
      priceCents: dto.priceCents ?? 0,
      duration: dto.duration ?? 'MONTHLY',
      features: dto.features ?? [],
      isActive: dto.isActive ?? true,
      sortOrder: dto.sortOrder ?? 0,
    });
    return this.plans.save(plan);
  }

  async update(user: AuthUser, id: string, dto: any): Promise<MembershipPlanEntity> {
    const plan = await this.findOwned(user, id);
    if (dto.name !== undefined) plan.name = dto.name;
    if (dto.description !== undefined) plan.description = dto.description ?? null;
    if (dto.priceCents !== undefined) plan.priceCents = dto.priceCents;
    if (dto.duration !== undefined) plan.duration = dto.duration;
    if (dto.features !== undefined) plan.features = dto.features ?? [];
    if (dto.isActive !== undefined) plan.isActive = dto.isActive;
    if (dto.sortOrder !== undefined) plan.sortOrder = dto.sortOrder ?? 0;
    return this.plans.save(plan);
  }

  async remove(user: AuthUser, id: string): Promise<{ ok: true }> {
    await this.findOwned(user, id);
    await this.plans.delete({ id });
    return { ok: true };
  }

  private async findOwned(user: AuthUser, id: string): Promise<MembershipPlanEntity> {
    const plan = await this.plans.findOne({ where: { id } });
    if (!plan) throw new NotFoundException('Plan not found.');
    if (!this.access.isSuperAdmin(user)) {
      const scope = await this.access.getScope(user);
      if (plan.facilityId && !scope.facilityIds.includes(plan.facilityId))
        throw new NotFoundException('Plan not found.');
    }
    return plan;
  }
}
