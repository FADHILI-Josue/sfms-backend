import { Column, Entity, Index, ManyToOne } from 'typeorm';

import { BaseEntity } from '../../../common/entities/base.entity';
import { UserEntity } from '../../users/entities/user.entity';
import { AuditSeverity } from '../audit.enums';

@Entity({ name: 'audit_logs' })
export class AuditLogEntity extends BaseEntity {
  @Column({ type: 'varchar', length: 120 })
  @Index()
  action!: string;

  @ManyToOne(() => UserEntity, { nullable: true, onDelete: 'SET NULL' })
  actor!: UserEntity | null;

  @Column({ type: 'uuid', nullable: true })
  actorId!: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  targetType!: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  targetId!: string | null;

  @Column({ type: 'simple-enum', enum: AuditSeverity, default: AuditSeverity.INFO })
  severity!: AuditSeverity;

  @Column({ type: 'simple-json', nullable: true })
  details!: Record<string, unknown> | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  requestId!: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  ip!: string | null;

  @Column({ type: 'varchar', length: 240, nullable: true })
  userAgent!: string | null;
}
