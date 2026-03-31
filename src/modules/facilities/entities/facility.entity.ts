import { Column, Entity, Index } from 'typeorm';

import { BaseEntity } from '../../../common/entities/base.entity';
import { dateTimeColumnType } from '../../../common/database/date-column-type';
import { FacilityStatus, FacilityType } from '../facility.enums';

@Entity({ name: 'facilities' })
export class FacilityEntity extends BaseEntity {
  @Column({ type: 'varchar', length: 180 })
  @Index()
  name!: string;

  @Column({ type: 'simple-enum', enum: FacilityType })
  type!: FacilityType;

  @Column({ type: 'simple-array', default: '' })
  supportedSports!: string[];

  @Column({ type: 'varchar', length: 80, nullable: true })
  dimensions!: string | null;

  @Column({ type: 'int', nullable: true })
  maxCapacity!: number | null;

  @Column({ type: 'simple-enum', enum: FacilityStatus, default: FacilityStatus.AVAILABLE })
  status!: FacilityStatus;

  @Column({ type: dateTimeColumnType as any, nullable: true })
  nextMaintenanceAt!: Date | null;

  @Column({ type: 'int', nullable: true })
  peakRateCents!: number | null;

  @Column({ type: 'int', nullable: true })
  offPeakRateCents!: number | null;

  // Intentionally no inverse relations here to avoid circular imports across modules.
}
