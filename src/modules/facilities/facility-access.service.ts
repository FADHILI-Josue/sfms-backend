import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import type { AuthUser } from '../auth/types/auth-user.type';
import { FacilityEntity } from './entities/facility.entity';
import { FacilityStaffEntity } from './entities/facility-staff.entity';

export type UserFacilityScope = {
  facilityIds: string[];
  courtIdsByFacilityId: Record<string, string[] | null>;
};

@Injectable()
export class FacilityAccessService {
  constructor(
    @InjectRepository(FacilityEntity) private readonly facilities: Repository<FacilityEntity>,
    @InjectRepository(FacilityStaffEntity) private readonly staff: Repository<FacilityStaffEntity>,
  ) {}

  isSuperAdmin(user: AuthUser | undefined) {
    return (user?.roles ?? []).includes('SUPER_ADMIN');
  }

  async getScope(user: AuthUser): Promise<UserFacilityScope> {
    const [owned, assignments] = await Promise.all([
      this.facilities.find({ where: { ownerId: user.id }, select: { id: true } }),
      this.staff.find({
        where: { userId: user.id, isActive: true },
        select: { facilityId: true, courtIds: true },
      }),
    ]);

    const facilityIds = new Set<string>(owned.map((f) => f.id));
    const courtIdsByFacilityId: Record<string, string[] | null> = {};

    for (const a of assignments) {
      facilityIds.add(a.facilityId);
      const existing = courtIdsByFacilityId[a.facilityId] ?? undefined;

      // null => unrestricted, always wins
      if (a.courtIds == null || a.courtIds.length === 0) {
        courtIdsByFacilityId[a.facilityId] = null;
        continue;
      }

      if (existing === null) continue;
      const merged = new Set<string>([...(existing ?? []), ...a.courtIds]);
      courtIdsByFacilityId[a.facilityId] = Array.from(merged);
    }

    // Owned facilities are unrestricted by default.
    for (const f of owned) {
      if (courtIdsByFacilityId[f.id] === undefined) courtIdsByFacilityId[f.id] = null;
    }

    return { facilityIds: Array.from(facilityIds), courtIdsByFacilityId };
  }

  async assertFacilityIdsVisible(user: AuthUser, facilityIds: string[]) {
    if (this.isSuperAdmin(user)) return true;
    const scope = await this.getScope(user);
    const allowed = new Set(scope.facilityIds);
    const ok = facilityIds.every((id) => allowed.has(id));
    return ok;
  }

  async listVisibleFacilities(user: AuthUser) {
    if (this.isSuperAdmin(user)) {
      return this.facilities.find({ order: { createdAt: 'DESC' } });
    }

    const scope = await this.getScope(user);
    if (scope.facilityIds.length === 0) return [];
    return this.facilities.find({
      where: { id: In(scope.facilityIds) },
      order: { createdAt: 'DESC' },
    });
  }
}
