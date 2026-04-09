import { Column, Entity, Index, ManyToOne, Unique } from 'typeorm';

import { BaseEntity } from '../../../common/entities/base.entity';
import { ServiceSessionEntity } from './service-session.entity';
import { ServiceBeneficiaryEntity } from './service-beneficiary.entity';
import { AttendanceStatus } from '../service.enums';

@Entity({ name: 'service_attendance' })
@Unique(['sessionId', 'beneficiaryId'])
export class ServiceAttendanceEntity extends BaseEntity {
  @Column({ type: 'uuid' })
  @Index()
  sessionId!: string;

  @ManyToOne(() => ServiceSessionEntity, { nullable: false, onDelete: 'CASCADE' })
  session!: ServiceSessionEntity;

  @Column({ type: 'uuid' })
  @Index()
  beneficiaryId!: string;

  @ManyToOne(() => ServiceBeneficiaryEntity, { nullable: false, onDelete: 'CASCADE' })
  beneficiary!: ServiceBeneficiaryEntity;

  @Column({ type: 'uuid' })
  @Index()
  providerId!: string;

  @Column({ type: 'simple-enum', enum: AttendanceStatus, default: AttendanceStatus.ABSENT })
  status!: AttendanceStatus;

  /** HH:MM (24h) */
  @Column({ type: 'varchar', length: 5, nullable: true })
  checkIn!: string | null;

  /** HH:MM (24h) */
  @Column({ type: 'varchar', length: 5, nullable: true })
  checkOut!: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  notes!: string | null;
}
