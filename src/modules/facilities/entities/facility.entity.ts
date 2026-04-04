import { Column, Entity, Index, ManyToOne } from 'typeorm';

import { BaseEntity } from '../../../common/entities/base.entity';
import { dateTimeColumnType } from '../../../common/database/date-column-type';
import { UserEntity } from '../../users/entities/user.entity';
import { FacilityApprovalStatus, FacilityStatus, FacilityType } from '../facility.enums';

@Entity({ name: 'facilities' })
export class FacilityEntity extends BaseEntity {
  @Column({ type: 'varchar', length: 180 })
  @Index()
  name!: string;

  @Column({ type: 'simple-enum', enum: FacilityType })
  type!: FacilityType;

  @Column({ type: 'simple-array', default: '' })
  supportedSports!: string[];

  @Column({ type: 'simple-array', default: '' })
  amenities!: string[];

  @Column({ type: 'varchar', length: 80, nullable: true })
  dimensions!: string | null;

  @Column({ type: 'int', nullable: true })
  maxCapacity!: number | null;

  @Column({ type: 'simple-enum', enum: FacilityStatus, default: FacilityStatus.AVAILABLE })
  status!: FacilityStatus;

  @Column({
    type: 'simple-enum',
    enum: FacilityApprovalStatus,
    default: FacilityApprovalStatus.APPROVED,
  })
  approvalStatus!: FacilityApprovalStatus;

  @ManyToOne(() => UserEntity, { nullable: true, onDelete: 'SET NULL' })
  owner!: UserEntity | null;

  @Column({ type: 'uuid', nullable: true })
  @Index()
  ownerId!: string | null;

  @ManyToOne(() => UserEntity, { nullable: true, onDelete: 'SET NULL' })
  approvedBy!: UserEntity | null;

  @Column({ type: 'uuid', nullable: true })
  approvedById!: string | null;

  @Column({ type: dateTimeColumnType as any, nullable: true })
  approvedAt!: Date | null;

  @Column({ type: 'varchar', length: 240, nullable: true })
  rejectionReason!: string | null;

  @Column({ type: dateTimeColumnType as any, nullable: true })
  nextMaintenanceAt!: Date | null;

  @Column({ type: 'int', nullable: true })
  peakRateCents!: number | null;

  @Column({ type: 'int', nullable: true })
  offPeakRateCents!: number | null;

  @Column({ type: 'simple-json', nullable: true })
  metadata!: Record<string, unknown> | null;

  // Intentionally no inverse relations here to avoid circular imports across modules.
}
