import 'reflect-metadata';
import 'dotenv/config';
import { DataSource } from 'typeorm';

import { AuditLogEntity } from '../modules/audit-logs/entities/audit-log.entity';
import { BookingEntity } from '../modules/bookings/entities/booking.entity';
import { PermissionEntity } from '../modules/access-control/entities/permission.entity';
import { RoleEntity } from '../modules/access-control/entities/role.entity';
import { CourtEntity } from '../modules/facilities/entities/court.entity';
import { FacilityEntity } from '../modules/facilities/entities/facility.entity';
import { FacilityStaffEntity } from '../modules/facilities/entities/facility-staff.entity';
import { FacilityApplicationEntity } from '../modules/facility-applications/entities/facility-application.entity';
import { MemberEntity } from '../modules/memberships/entities/member.entity';
import { PaymentEntity } from '../modules/payments/entities/payment.entity';
import { UserEntity } from '../modules/users/entities/user.entity';

const enabled = process.env.DB_ENABLED
  ? process.env.DB_ENABLED === 'true'
  : process.env.NODE_ENV !== 'test';

if (!enabled) {
  throw new Error('DB is disabled. Set DB_ENABLED=true to use the data source.');
}

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  logging: process.env.DB_LOGGING === 'true',
  synchronize: process.env.DB_SYNCHRONIZE === 'true',
  entities: [
    UserEntity,
    RoleEntity,
    PermissionEntity,
    FacilityEntity,
    CourtEntity,
    FacilityStaffEntity,
    FacilityApplicationEntity,
    MemberEntity,
    BookingEntity,
    PaymentEntity,
    AuditLogEntity,
  ],
  migrations: [],
});
