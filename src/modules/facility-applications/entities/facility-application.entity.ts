import { Column, Entity, Index, ManyToOne } from 'typeorm';

import { BaseEntity } from '../../../common/entities/base.entity';
import { UserEntity } from '../../users/entities/user.entity';
import { FacilityApplicationStatus } from '../facility-application.enums';

@Entity({ name: 'facility_applications' })
export class FacilityApplicationEntity extends BaseEntity {
  @Column({ type: 'varchar', length: 180 })
  ownerName!: string;

  @Column({ type: 'varchar', length: 180 })
  @Index()
  ownerEmail!: string;

  @Column({ type: 'varchar', length: 40, nullable: true })
  ownerPhone!: string | null;

  @Column({ type: 'varchar', length: 180, nullable: true })
  organization!: string | null;

  @Column({ type: 'varchar', length: 180 })
  facilityName!: string;

  @Column({ type: 'varchar', length: 120 })
  facilityTypeLabel!: string;

  @Column({ type: 'simple-array', default: '' })
  requestedSports!: string[];

  @Column({ type: 'varchar', length: 240, nullable: true })
  location!: string | null;

  @Column({ type: 'int', nullable: true })
  capacity!: number | null;

  @Column({ type: 'varchar', length: 80, nullable: true })
  dimensions!: string | null;

  @Column({ type: 'varchar', length: 240, nullable: true })
  amenities!: string | null;

  @Column({ type: 'varchar', length: 800, nullable: true })
  description!: string | null;

  @Column({ type: 'simple-enum', enum: FacilityApplicationStatus, default: FacilityApplicationStatus.PENDING })
  status!: FacilityApplicationStatus;

  @ManyToOne(() => UserEntity, { nullable: true, onDelete: 'SET NULL' })
  decidedBy!: UserEntity | null;

  @Column({ type: 'uuid', nullable: true })
  decidedById!: string | null;

  @Column({ type: 'varchar', length: 240, nullable: true })
  decisionReason!: string | null;
}

