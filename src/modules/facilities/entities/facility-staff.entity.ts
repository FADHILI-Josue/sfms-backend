import { Column, Entity, Index, ManyToOne } from 'typeorm';

import { BaseEntity } from '../../../common/entities/base.entity';
import { UserEntity } from '../../users/entities/user.entity';
import { FacilityEntity } from './facility.entity';

@Entity({ name: 'facility_staff' })
@Index(['facilityId', 'userId', 'roleName'], { unique: true })
export class FacilityStaffEntity extends BaseEntity {
  @ManyToOne(() => FacilityEntity, { nullable: false, onDelete: 'CASCADE' })
  facility!: FacilityEntity;

  @Column({ type: 'uuid' })
  @Index()
  facilityId!: string;

  @ManyToOne(() => UserEntity, { nullable: false, onDelete: 'CASCADE' })
  user!: UserEntity;

  @Column({ type: 'uuid' })
  @Index()
  userId!: string;

  @Column({ type: 'varchar', length: 80 })
  roleName!: string;

  @Column({ type: 'simple-array', nullable: true })
  courtIds!: string[] | null;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;
}

