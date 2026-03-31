import { Column, Entity, Index, ManyToMany } from 'typeorm';

import { BaseEntity } from '../../../common/entities/base.entity';
import { RoleEntity } from './role.entity';

@Entity({ name: 'permissions' })
export class PermissionEntity extends BaseEntity {
  @Column({ type: 'varchar', length: 120, unique: true })
  @Index()
  key!: string;

  @Column({ type: 'varchar', length: 240, nullable: true })
  description!: string | null;

  @ManyToMany(() => RoleEntity, (role) => role.permissions)
  roles!: RoleEntity[];
}

