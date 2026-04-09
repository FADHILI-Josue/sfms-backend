import { Column, Entity, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { FacilityEntity } from '../../facilities/entities/facility.entity';

@Entity({ name: 'membership_discounts' })
export class MembershipDiscountEntity extends BaseEntity {
  @Column({ type: 'uuid', nullable: true })
  facilityId!: string | null;

  @ManyToOne(() => FacilityEntity, { nullable: true, onDelete: 'CASCADE' })
  facility!: FacilityEntity | null;

  @Column({ type: 'varchar', length: 80 })
  code!: string;

  @Column({ type: 'varchar', length: 20, default: 'PERCENTAGE' })
  type!: 'PERCENTAGE' | 'FIXED';

  /** Percentage (0-100) or fixed amount in cents */
  @Column({ type: 'int', default: 0 })
  value!: number;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'date', nullable: true })
  validFrom!: string | null;

  @Column({ type: 'date', nullable: true })
  validTo!: string | null;

  /** null = unlimited */
  @Column({ type: 'int', nullable: true })
  maxUses!: number | null;

  @Column({ type: 'int', default: 0 })
  usedCount!: number;

  /** JSON array of plan IDs this applies to — empty = all plans */
  @Column({ type: 'simple-json', nullable: true })
  planIds!: string[] | null;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;
}
