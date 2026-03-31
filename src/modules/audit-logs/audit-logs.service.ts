import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { AuditLogEntity } from './entities/audit-log.entity';
import { AuditSeverity } from './audit.enums';

@Injectable()
export class AuditLogsService {
  constructor(
    @InjectRepository(AuditLogEntity)
    private readonly auditLogs: Repository<AuditLogEntity>,
  ) {}

  list() {
    return this.auditLogs.find({ order: { createdAt: 'DESC' }, take: 200 });
  }

  async record(entry: {
    action: string;
    actorId?: string | null;
    targetType?: string | null;
    targetId?: string | null;
    severity?: AuditSeverity;
    details?: Record<string, unknown> | null;
    requestId?: string | null;
    ip?: string | null;
    userAgent?: string | null;
  }) {
    const log = this.auditLogs.create({
      action: entry.action,
      actorId: entry.actorId ?? null,
      targetType: entry.targetType ?? null,
      targetId: entry.targetId ?? null,
      severity: entry.severity ?? AuditSeverity.INFO,
      details: entry.details ?? null,
      requestId: entry.requestId ?? null,
      ip: entry.ip ?? null,
      userAgent: entry.userAgent ?? null,
    });
    await this.auditLogs.save(log);
  }
}

