import { Column, Entity, Index, ManyToOne } from 'typeorm';

import { BaseEntity } from '../../../common/entities/base.entity';
import { UserEntity } from '../../users/entities/user.entity';
import { FacilityEntity } from '../../facilities/entities/facility.entity';

@Entity({ name: 'service_provider_profiles' })
export class ServiceProviderProfileEntity extends BaseEntity {
  @Column({ type: 'uuid' })
  @Index({ unique: true })
  userId!: string;

  @ManyToOne(() => UserEntity, { nullable: false, onDelete: 'CASCADE' })
  user!: UserEntity;

  @Column({ type: 'uuid', nullable: true })
  @Index()
  facilityId!: string | null;

  @ManyToOne(() => FacilityEntity, { nullable: true, onDelete: 'SET NULL' })
  facility!: FacilityEntity | null;

  @Column({ type: 'varchar', length: 180, nullable: true })
  title!: string | null;

  @Column({ type: 'text', nullable: true })
  bio!: string | null;

  @Column({ type: 'varchar', length: 60, nullable: true })
  phone!: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  location!: string | null;

  @Column({ type: 'simple-array', default: '' })
  skills!: string[];

  @Column({ type: 'simple-array', default: '' })
  certifications!: string[];

  @Column({ type: 'simple-json', nullable: true })
  availability!: Record<string, string> | null;
}
