import { Column, Entity, Index, JoinTable, ManyToMany } from 'typeorm';

import { BaseEntity } from '../../../common/entities/base.entity';
import { dateTimeColumnType } from '../../../common/database/date-column-type';
import { RoleEntity } from '../../access-control/entities/role.entity';
import { UserStatus } from '../user-status.enum';

@Entity({ name: 'users' })
export class UserEntity extends BaseEntity {
  @Column({ type: 'varchar', length: 180, unique: true })
  @Index()
  email!: string;

  @Column({ type: 'varchar', length: 180 })
  fullName!: string;

  @Column({ type: 'varchar', length: 255 })
  passwordHash!: string;

  @Column({ type: 'simple-enum', enum: UserStatus, default: UserStatus.ACTIVE })
  status!: UserStatus;

  @Column({ type: dateTimeColumnType as any, nullable: true })
  lastLoginAt!: Date | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  refreshTokenHash!: string | null;

  @ManyToMany(() => RoleEntity, { cascade: false })
  @JoinTable({
    name: 'user_roles',
    joinColumn: { name: 'userId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'roleId', referencedColumnName: 'id' },
  })
  roles!: RoleEntity[];
}
