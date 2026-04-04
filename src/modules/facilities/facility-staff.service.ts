import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import type { AuthUser } from '../auth/types/auth-user.type';
import { hashSecret } from '../../common/security/password-hasher';
import { RoleEntity } from '../access-control/entities/role.entity';
import { UserEntity } from '../users/entities/user.entity';
import { FacilityAccessService } from './facility-access.service';
import { FacilityEntity } from './entities/facility.entity';
import { FacilityStaffEntity } from './entities/facility-staff.entity';
import { UpsertFacilityStaffDto } from './dto/upsert-facility-staff.dto';

@Injectable()
export class FacilityStaffService {
  constructor(
    @InjectRepository(FacilityStaffEntity) private readonly staff: Repository<FacilityStaffEntity>,
    @InjectRepository(FacilityEntity) private readonly facilities: Repository<FacilityEntity>,
    @InjectRepository(UserEntity) private readonly users: Repository<UserEntity>,
    @InjectRepository(RoleEntity) private readonly roles: Repository<RoleEntity>,
    private readonly access: FacilityAccessService,
  ) {}

  private isSuperAdmin(user: AuthUser) {
    return this.access.isSuperAdmin(user);
  }

  private isFacilityOwner(user: AuthUser) {
    return (user.roles ?? []).includes('FACILITY_OWNER');
  }

  private async assertCanManageFacilityStaff(user: AuthUser, facilityId: string) {
    if (this.isSuperAdmin(user)) return;

    // Owners can manage staff only for their own facilities.
    if (this.isFacilityOwner(user)) {
      const owns = await this.facilities.exist({ where: { id: facilityId, ownerId: user.id } });
      if (owns) return;
    }

    throw new NotFoundException('Facility not found.');
  }

  async listForFacility(user: AuthUser, facilityId: string) {
    await this.assertCanManageFacilityStaff(user, facilityId);
    const assignments = await this.staff.find({
      where: { facilityId, isActive: true },
      order: { createdAt: 'DESC' },
    });

    const userIds = Array.from(new Set(assignments.map((a) => a.userId)));
    const users = await this.users.find({
      where: { id: In(userIds) },
      select: { id: true, email: true, fullName: true },
    });
    const byId = new Map(users.map((u) => [u.id, u]));

    return assignments.map((a) => ({
      id: a.id,
      facilityId: a.facilityId,
      roleName: a.roleName,
      courtIds: a.courtIds,
      isActive: a.isActive,
      createdAt: a.createdAt,
      user: byId.get(a.userId) ?? { id: a.userId, email: '', fullName: '' },
    }));
  }

  async upsert(user: AuthUser, facilityId: string, dto: UpsertFacilityStaffDto) {
    await this.assertCanManageFacilityStaff(user, facilityId);

    const facilityOk = await this.facilities.exist({ where: { id: facilityId } });
    if (!facilityOk) throw new BadRequestException('Facility not found.');

    const roleName = dto.roleName.trim().toUpperCase();
    const roleExists = await this.roles.exist({ where: { name: roleName } });
    if (!roleExists) throw new BadRequestException('roleName is invalid.');

    let staffUser: UserEntity | null = null;

    if (dto.userId) {
      staffUser = await this.users.findOne({ where: { id: dto.userId }, relations: { roles: true } });
      if (!staffUser) throw new BadRequestException('User not found.');
    } else {
      if (!dto.email || !dto.fullName || !dto.password) {
        throw new BadRequestException('email, fullName and password are required when creating a new user.');
      }

      const email = dto.email.toLowerCase();
      const existing = await this.users.findOne({ where: { email }, relations: { roles: true } });
      if (existing) {
        staffUser = existing;
      } else {
        staffUser = this.users.create({
          email,
          fullName: dto.fullName,
          passwordHash: await hashSecret(dto.password),
          roles: [],
        });
        staffUser = await this.users.save(staffUser);
        staffUser = await this.users.findOneOrFail({ where: { id: staffUser.id }, relations: { roles: true } });
      }
    }

    if (dto.roleIds) {
      const roles = await this.roles.find({ where: { id: In(dto.roleIds) } });
      if (roles.length !== dto.roleIds.length) throw new BadRequestException('One or more roleIds are invalid.');
      staffUser.roles = roles;
      await this.users.save(staffUser);
    } else {
      // Ensure the user has the assignment role.
      const role = await this.roles.findOneOrFail({ where: { name: roleName } });
      if (!(staffUser.roles ?? []).some((r) => r.name === roleName)) {
        staffUser.roles = [...(staffUser.roles ?? []), role];
        await this.users.save(staffUser);
      }
    }

    const existingAssignment = await this.staff.findOne({
      where: { facilityId, userId: staffUser.id, roleName },
    });

    const courtIds = dto.courtIds?.length ? dto.courtIds : null;

    let saved: FacilityStaffEntity;
    if (existingAssignment) {
      existingAssignment.courtIds = courtIds;
      existingAssignment.isActive = true;
      saved = await this.staff.save(existingAssignment);
    } else {
      const assignment = this.staff.create({
        facilityId,
        userId: staffUser.id,
        roleName,
        courtIds,
        isActive: true,
      });

      saved = await this.staff.save(assignment);
    }

    return {
      id: saved.id,
      facilityId: saved.facilityId,
      roleName: saved.roleName,
      courtIds: saved.courtIds,
      isActive: saved.isActive,
      createdAt: saved.createdAt,
      user: { id: staffUser.id, email: staffUser.email, fullName: staffUser.fullName },
    };
  }

  async deactivate(user: AuthUser, facilityId: string, assignmentId: string) {
    await this.assertCanManageFacilityStaff(user, facilityId);
    const assignment = await this.staff.findOne({ where: { id: assignmentId, facilityId } });
    if (!assignment) throw new NotFoundException('Staff assignment not found.');
    assignment.isActive = false;
    await this.staff.save(assignment);
    return { ok: true };
  }
}
