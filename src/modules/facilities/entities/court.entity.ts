import { Column, Entity, Index, ManyToOne } from 'typeorm';

import { BaseEntity } from '../../../common/entities/base.entity';
import { FacilityEntity } from './facility.entity';

@Entity({ name: 'courts' })
@Index(['facilityId', 'name'], { unique: true })
export class CourtEntity extends BaseEntity {
  @ManyToOne(() => FacilityEntity, { nullable: false, onDelete: 'CASCADE' })
  facility!: FacilityEntity;

  @Column({ type: 'uuid' })
  @Index()
  facilityId!: string;

  @Column({ type: 'varchar', length: 180 })
  name!: string;

  @Column({ type: 'simple-array', default: '' })
  supportedSports!: string[];

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ type: 'simple-json', nullable: true })
  metadata!: Record<string, unknown> | null;
}

