import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import type { AuthUser } from '../auth/types/auth-user.type';
import { FacilityAccessService } from '../facilities/facility-access.service';
import { MembershipDiscountEntity } from './entities/membership-discount.entity';

@Injectable()
export class MembershipDiscountsService {
  constructor(
    @InjectRepository(MembershipDiscountEntity) private readonly discounts: Repository<MembershipDiscountEntity>,
    private readonly access: FacilityAccessService,
  ) {}

  async listForUser(user: AuthUser, facilityId?: string): Promise<MembershipDiscountEntity[]> {
    if (this.access.isSuperAdmin(user)) {
      return this.discounts.find({
        where: facilityId ? { facilityId } : undefined,
        order: { createdAt: 'DESC' },
        take: 500,
      });
    }
    const scope = await this.access.getScope(user);
    const ids = facilityId
      ? scope.facilityIds.filter((id) => id === facilityId)
      : scope.facilityIds;
    if (ids.length === 0) return [];
    return this.discounts.find({
      where: ids.map((id) => ({ facilityId: id })),
      order: { createdAt: 'DESC' },
      take: 500,
    });
  }

  async create(user: AuthUser, dto: any): Promise<MembershipDiscountEntity> {
    if (!dto.facilityId) throw new BadRequestException('facilityId is required');
    if (!this.access.isSuperAdmin(user)) {
      const scope = await this.access.getScope(user);
      if (!scope.facilityIds.includes(dto.facilityId))
        throw new BadRequestException('Facility not found.');
    }
    const existing = await this.discounts.findOne({
      where: { facilityId: dto.facilityId, code: String(dto.code).toUpperCase() },
    });
    if (existing) throw new BadRequestException('A discount with this code already exists for this facility.');

    const discount = this.discounts.create({
      facilityId: dto.facilityId,
      code: String(dto.code).toUpperCase(),
      type: dto.type ?? 'PERCENTAGE',
      value: dto.value ?? 0,
      description: dto.description ?? null,
      validFrom: dto.validFrom ?? null,
      validTo: dto.validTo ?? null,
      maxUses: dto.maxUses ?? null,
      usedCount: 0,
      planIds: dto.planIds ?? [],
      isActive: dto.isActive ?? true,
    });
    return this.discounts.save(discount);
  }

  async update(user: AuthUser, id: string, dto: any): Promise<MembershipDiscountEntity> {
    const discount = await this.findOwned(user, id);
    if (dto.code !== undefined) discount.code = String(dto.code).toUpperCase();
    if (dto.type !== undefined) discount.type = dto.type;
    if (dto.value !== undefined) discount.value = dto.value;
    if (dto.description !== undefined) discount.description = dto.description ?? null;
    if (dto.validFrom !== undefined) discount.validFrom = dto.validFrom ?? null;
    if (dto.validTo !== undefined) discount.validTo = dto.validTo ?? null;
    if (dto.maxUses !== undefined) discount.maxUses = dto.maxUses ?? null;
    if (dto.planIds !== undefined) discount.planIds = dto.planIds ?? [];
    if (dto.isActive !== undefined) discount.isActive = dto.isActive;
    return this.discounts.save(discount);
  }

  async remove(user: AuthUser, id: string): Promise<{ ok: true }> {
    await this.findOwned(user, id);
    await this.discounts.delete({ id });
    return { ok: true };
  }

  private async findOwned(user: AuthUser, id: string): Promise<MembershipDiscountEntity> {
    const discount = await this.discounts.findOne({ where: { id } });
    if (!discount) throw new NotFoundException('Discount not found.');
    if (!this.access.isSuperAdmin(user)) {
      const scope = await this.access.getScope(user);
      if (discount.facilityId && !scope.facilityIds.includes(discount.facilityId))
        throw new NotFoundException('Discount not found.');
    }
    return discount;
  }
}
