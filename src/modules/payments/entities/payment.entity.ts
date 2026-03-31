import { Column, Entity, Index, ManyToOne } from 'typeorm';

import { BaseEntity } from '../../../common/entities/base.entity';
import { dateTimeColumnType } from '../../../common/database/date-column-type';
import { MemberEntity } from '../../memberships/entities/member.entity';
import { PaymentMethod, PaymentStatus } from '../payment.enums';

@Entity({ name: 'payments' })
export class PaymentEntity extends BaseEntity {
  @ManyToOne(() => MemberEntity, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  member!: MemberEntity;

  @Column({ type: 'uuid' })
  @Index()
  memberId!: string;

  @Column({ type: 'varchar', length: 80, nullable: true })
  billingPeriod!: string | null;

  @Column({ type: 'int' })
  amountDueCents!: number;

  @Column({ type: 'int', default: 0 })
  amountPaidCents!: number;

  @Column({ type: 'simple-enum', enum: PaymentMethod })
  method!: PaymentMethod;

  @Column({ type: 'simple-enum', enum: PaymentStatus, default: PaymentStatus.PENDING })
  status!: PaymentStatus;

  @Column({ type: dateTimeColumnType as any, nullable: true })
  paidAt!: Date | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  reference!: string | null;
}
