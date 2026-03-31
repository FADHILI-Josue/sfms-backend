import { AppDataSource } from '../data-source';
import { PermissionEntity } from '../../modules/access-control/entities/permission.entity';
import { RoleEntity } from '../../modules/access-control/entities/role.entity';
import { UserEntity } from '../../modules/users/entities/user.entity';
import { systemRoles, permissionKeys } from './seed.data';
import { In } from 'typeorm';
import { hashSecret } from '../../common/security/password-hasher';

async function seed() {
  const seedEnabled = process.env.SEED_ENABLED === 'true';
  if (!seedEnabled) {
    throw new Error('Seeding disabled. Set SEED_ENABLED=true.');
  }

  await AppDataSource.initialize();

  const permissionsRepo = AppDataSource.getRepository(PermissionEntity);
  const rolesRepo = AppDataSource.getRepository(RoleEntity);
  const usersRepo = AppDataSource.getRepository(UserEntity);

  await permissionsRepo.upsert(
    permissionKeys.map((key) => ({ key, description: null })),
    ['key'],
  );

  for (const roleDef of systemRoles) {
    await rolesRepo.upsert(
      [
        {
          name: roleDef.name,
          description: roleDef.description,
          isSystem: true,
        },
      ],
      ['name'],
    );

    const role = await rolesRepo.findOneOrFail({ where: { name: roleDef.name }, relations: { permissions: true } });
    const perms = await permissionsRepo.find({ where: { key: In([...roleDef.permissionKeys]) } });

    role.permissions = perms;
    await rolesRepo.save(role);
  }

  const adminEmail = (process.env.SEED_SUPER_ADMIN_EMAIL ?? 'admin@example.com').toLowerCase();
  const adminName = process.env.SEED_SUPER_ADMIN_NAME ?? 'Super Admin';
  const adminPassword = process.env.SEED_SUPER_ADMIN_PASSWORD ?? 'ChangeMe123!';

  const superAdminRole = await rolesRepo.findOneOrFail({ where: { name: 'SUPER_ADMIN' } });

  let admin = await usersRepo.findOne({ where: { email: adminEmail }, relations: { roles: true } });
  if (!admin) {
    admin = usersRepo.create({
      email: adminEmail,
      fullName: adminName,
      passwordHash: await hashSecret(adminPassword),
      roles: [superAdminRole],
    });
    await usersRepo.save(admin);
  } else {
    admin.fullName = adminName;
    if (!(admin.roles ?? []).some((r) => r.name === 'SUPER_ADMIN')) {
      admin.roles = [...(admin.roles ?? []), superAdminRole];
    }
    await usersRepo.save(admin);
  }

  // eslint-disable-next-line no-console
  console.log(`Seeded permissions (${permissionKeys.length}), roles (${systemRoles.length}), super admin (${adminEmail}).`);

  await AppDataSource.destroy();
}

seed().catch(async (err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  try {
    if (AppDataSource.isInitialized) await AppDataSource.destroy();
  } catch {
    // ignore
  }
  process.exitCode = 1;
});
