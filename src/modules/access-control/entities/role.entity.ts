import { Column, Entity, Index, JoinTable, ManyToMany } from 'typeorm';

import { BaseEntity } from '../../../common/entities/base.entity';
import { PermissionEntity } from './permission.entity';

@Entity({ name: 'roles' })
export class RoleEntity extends BaseEntity {
  @Column({ type: 'varchar', length: 80, unique: true })
  @Index()
  name!: string;

  @Column({ type: 'varchar', length: 240, nullable: true })
  description!: string | null;

  @Column({ type: 'boolean', default: false })
  isSystem!: boolean;

  @ManyToMany(() => PermissionEntity, (permission) => permission.roles, {
    cascade: false,
  })
  @JoinTable({
    name: 'role_permissions',
    joinColumn: { name: 'roleId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'permissionId', referencedColumnName: 'id' },
  })
  permissions!: PermissionEntity[];
}

