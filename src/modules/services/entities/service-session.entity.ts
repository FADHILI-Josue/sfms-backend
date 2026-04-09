import { Column, Entity, Index, ManyToOne } from 'typeorm';

import { BaseEntity } from '../../../common/entities/base.entity';
import { ServiceProviderProfileEntity } from './service-provider-profile.entity';
import { ServiceProgramEntity } from './service-program.entity';
import { SessionType, SessionStatus } from '../service.enums';

@Entity({ name: 'service_sessions' })
export class ServiceSessionEntity extends BaseEntity {
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

  /** YYYY-MM-DD */
  @Column({ type: 'varchar', length: 10 })
  @Index()
  scheduledDate!: string;

  /** HH:MM (24h) */
  @Column({ type: 'varchar', length: 5 })
  startTime!: string;

  @Column({ type: 'int', default: 60 })
  durationMinutes!: number;

  @Column({ type: 'simple-enum', enum: SessionType, default: SessionType.INDIVIDUAL })
  type!: SessionType;

  @Column({ type: 'simple-enum', enum: SessionStatus, default: SessionStatus.PENDING })
  status!: SessionStatus;

  @Column({ type: 'varchar', length: 180, nullable: true })
  title!: string | null;

  /** For individual sessions: which beneficiary */
  @Column({ type: 'uuid', nullable: true })
  beneficiaryId!: string | null;
}
