import { Column, Entity, Index, ManyToOne } from 'typeorm';

import { BaseEntity } from '../../../common/entities/base.entity';
import { ServiceProviderProfileEntity } from './service-provider-profile.entity';
import { ProgramStatus } from '../service.enums';

@Entity({ name: 'service_programs' })
export class ServiceProgramEntity extends BaseEntity {
  @Column({ type: 'uuid' })
  @Index()
  providerId!: string;

  @ManyToOne(() => ServiceProviderProfileEntity, { nullable: false, onDelete: 'CASCADE' })
  provider!: ServiceProviderProfileEntity;

  @Column({ type: 'varchar', length: 180 })
  name!: string;

  @Column({ type: 'varchar', length: 80 })
  category!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'int', default: 60 })
  durationMinutes!: number;

  @Column({ type: 'int', default: 10 })
  maxBeneficiaries!: number;

  @Column({ type: 'simple-enum', enum: ProgramStatus, default: ProgramStatus.DRAFT })
  status!: ProgramStatus;
}
