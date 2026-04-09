import { Column, Entity, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { FacilityEntity } from '../../facilities/entities/facility.entity';

@Entity({ name: 'membership_plans' })
export class MembershipPlanEntity extends BaseEntity {
  @Column({ type: 'uuid', nullable: true })
  facilityId!: string | null;

  @ManyToOne(() => FacilityEntity, { nullable: true, onDelete: 'CASCADE' })
  facility!: FacilityEntity | null;

  @Column({ type: 'varchar', length: 200 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  /** Price in cents */
  @Column({ type: 'int', default: 0 })
  priceCents!: number;

  /** e.g. MONTHLY, QUARTERLY, ANNUALLY, PAY_PER_SESSION */
  @Column({ type: 'varchar', length: 40, default: 'MONTHLY' })
  duration!: string;

  /** JSON array of feature strings */
  @Column({ type: 'simple-json', nullable: true })
  features!: string[] | null;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ type: 'int', default: 0 })
  sortOrder!: number;
}
