import { Column, Entity, Index, ManyToOne } from 'typeorm';

import { BaseEntity } from '../../../common/entities/base.entity';
import { ServiceProviderProfileEntity } from './service-provider-profile.entity';
import { ServiceProgramEntity } from './service-program.entity';
import { BeneficiaryStatus } from '../service.enums';
import { dateTimeColumnType } from '../../../common/database/date-column-type';

@Entity({ name: 'service_beneficiaries' })
export class ServiceBeneficiaryEntity extends BaseEntity {
  @Column({ type: 'uuid' })
  @Index()
  providerId!: string;

  @ManyToOne(() => ServiceProviderProfileEntity, { nullable: false, onDelete: 'CASCADE' })
  provider!: ServiceProviderProfileEntity;

  @Column({ type: 'uuid' })
  @Index()
  programId!: string;

  @ManyToOne(() => ServiceProgramEntity, { nullable: false, onDelete: 'CASCADE' })
  program!: ServiceProgramEntity;

  @Column({ type: 'varchar', length: 180 })
  name!: string;

  @Column({ type: 'varchar', length: 60, nullable: true })
  phone!: string | null;

  @Column({ type: 'varchar', length: 180, nullable: true })
  email!: string | null;

  @Column({ type: 'int', default: 20 })
  totalSessions!: number;

  @Column({ type: 'int', default: 0 })
  sessionsCompleted!: number;

  @Column({ type: 'simple-enum', enum: BeneficiaryStatus, default: BeneficiaryStatus.ACTIVE })
  status!: BeneficiaryStatus;

  @Column({ type: dateTimeColumnType as any, default: () => 'CURRENT_TIMESTAMP' })
  enrolledAt!: Date;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;
}
