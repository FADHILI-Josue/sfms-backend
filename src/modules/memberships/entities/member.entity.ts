import { Column, Entity, Index, ManyToOne } from 'typeorm';

import { BaseEntity } from '../../../common/entities/base.entity';
import { dateTimeColumnType } from '../../../common/database/date-column-type';
import { FacilityEntity } from '../../facilities/entities/facility.entity';
import { MembershipCategory, MembershipStatus, PaymentPlan } from '../membership.enums';

@Entity({ name: 'members' })
export class MemberEntity extends BaseEntity {
  @Column({ type: 'varchar', length: 200 })
  @Index()
  name!: string;

  @Column({ type: 'simple-enum', enum: MembershipCategory })
  category!: MembershipCategory;

  @Column({ type: 'varchar', length: 80 })
  sport!: string;

  @Column({ type: 'simple-enum', enum: MembershipStatus, default: MembershipStatus.ACTIVE })
  status!: MembershipStatus;

  @Column({ type: 'simple-enum', enum: PaymentPlan, default: PaymentPlan.MONTHLY })
  plan!: PaymentPlan;

  @Column({ type: 'int', default: 1 })
  memberCount!: number;

  @Column({ type: dateTimeColumnType as any, nullable: true })
  joinedAt!: Date | null;

  @Column({ type: 'varchar', length: 120, nullable: true, unique: true })
  @Index()
  digitalCardId!: string | null;

  @ManyToOne(() => FacilityEntity, { nullable: true, onDelete: 'SET NULL' })
  facility!: FacilityEntity | null;

  @Column({ type: 'uuid', nullable: true })
  facilityId!: string | null;

  // Intentionally no inverse relations here to avoid circular imports across modules.
}
