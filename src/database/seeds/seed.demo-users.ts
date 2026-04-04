import { In, Repository } from 'typeorm';

import { hashSecret } from '../../common/security/password-hasher';
import { RoleEntity } from '../../modules/access-control/entities/role.entity';
import { FacilityStaffEntity } from '../../modules/facilities/entities/facility-staff.entity';
import { UserEntity } from '../../modules/users/entities/user.entity';

export const demoUserDefs = [
  { email: 'admin@sfms.io', password: 'admin123', fullName: 'Super Admin', roleName: 'SUPER_ADMIN' },
  { email: 'owner@sfms.io', password: 'owner123', fullName: 'Facility Owner', roleName: 'FACILITY_OWNER' },
  { email: 'facility@sfms.io', password: 'facility123', fullName: 'Facility Manager', roleName: 'FACILITY_ADMIN' },
  { email: 'finance@sfms.io', password: 'finance123', fullName: 'Finance Officer', roleName: 'FINANCE_OFFICER' },
  { email: 'ops@sfms.io', password: 'ops123', fullName: 'Operations Manager', roleName: 'OPERATIONS_MANAGER' },
  { email: 'coach@sfms.io', password: 'coach123', fullName: 'Coach Williams', roleName: 'COACH_TEAM_MANAGER' },
  { email: 'player@sfms.io', password: 'player123', fullName: 'James Okoro', roleName: 'COMMUNITY_PLAYER' },
] as const;

export async function seedDemoUsers(opts: {
  usersRepo: Repository<UserEntity>;
  rolesRepo: Repository<RoleEntity>;
}) {
  const roleNames = demoUserDefs.map((d) => d.roleName);
  const roles = await opts.rolesRepo.find({ where: { name: In(roleNames as any) } });
  const roleByName = new Map(roles.map((r) => [r.name, r]));

  const usersByEmail = new Map<string, UserEntity>();

  for (const def of demoUserDefs) {
    const role = roleByName.get(def.roleName);
    if (!role) throw new Error(`Missing role ${def.roleName}. Run role seeding first.`);

    const email = def.email.toLowerCase();
    let user = await opts.usersRepo.findOne({ where: { email }, relations: { roles: true } });
    if (!user) {
      user = opts.usersRepo.create({
        email,
        fullName: def.fullName,
        passwordHash: await hashSecret(def.password),
        roles: [role],
      });
    } else {
      user.fullName = def.fullName;
      user.passwordHash = await hashSecret(def.password);
      if (!(user.roles ?? []).some((r) => r.name === role.name)) {
        user.roles = [...(user.roles ?? []), role];
      }
    }
    user = await opts.usersRepo.save(user);
    usersByEmail.set(email, user);
  }

  return { usersByEmail };
}

export async function seedDemoFacilityStaffAssignments(opts: {
  staffRepo: Repository<FacilityStaffEntity>;
  usersByEmail: Map<string, UserEntity>;
  facilitiesByName: Map<string, { id: string }>;
  courtsByName: Map<string, { id: string }>;
}) {
  const thunder = opts.facilitiesByName.get('Thunder Arena')?.id;
  const velocity = opts.facilitiesByName.get('Velocity Pitch')?.id;
  const courtA = opts.courtsByName.get('Thunder Arena / Court A')?.id;

  const facilityManager = opts.usersByEmail.get('facility@sfms.io');
  const finance = opts.usersByEmail.get('finance@sfms.io');
  const ops = opts.usersByEmail.get('ops@sfms.io');

  if (thunder && facilityManager && finance && ops) {
    await opts.staffRepo.upsert(
      [
        { facilityId: thunder, userId: facilityManager.id, roleName: 'FACILITY_ADMIN', courtIds: null, isActive: true },
        { facilityId: thunder, userId: ops.id, roleName: 'OPERATIONS_MANAGER', courtIds: null, isActive: true },
        { facilityId: thunder, userId: finance.id, roleName: 'FINANCE_OFFICER', courtIds: courtA ? [courtA] : null, isActive: true },
      ],
      ['facilityId', 'userId', 'roleName'],
    );
  }

  if (velocity && facilityManager) {
    await opts.staffRepo.upsert(
      [{ facilityId: velocity, userId: facilityManager.id, roleName: 'FACILITY_ADMIN', courtIds: null, isActive: true }],
      ['facilityId', 'userId', 'roleName'],
    );
  }
}
