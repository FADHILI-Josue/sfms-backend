import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { AuditLogEntity } from './entities/audit-log.entity';
import { AuditCategory, AuditSeverity } from './audit.enums';

export interface RecordAuditEntry {
  action: string;
  category?: AuditCategory | string;
  actorId?: string | null;
  actorName?: string | null;
  targetType?: string | null;
  targetId?: string | null;
  severity?: AuditSeverity;
  details?: Record<string, unknown> | null;
  requestId?: string | null;
  ip?: string | null;
  userAgent?: string | null;
}

export interface ListAuditParams {
  category?: string;
  severity?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
}

@Injectable()
export class AuditLogsService {
  constructor(
    @InjectRepository(AuditLogEntity)
    private readonly auditLogs: Repository<AuditLogEntity>,
  ) {}

  async list(params?: ListAuditParams) {
    const qb = this.auditLogs
      .createQueryBuilder('log')
      .leftJoinAndSelect('log.actor', 'actor')
      .orderBy('log.createdAt', 'DESC')
      .take(params?.limit ?? 500);

    if (params?.category && params.category !== 'ALL') {
      qb.andWhere('log.category = :category', { category: params.category });
    }
    if (params?.severity && params.severity !== 'ALL') {
      qb.andWhere('log.severity = :severity', { severity: params.severity.toUpperCase() });
    }
    if (params?.search) {
      const s = `%${params.search}%`;
      qb.andWhere(
        '(log.action LIKE :s OR log.actorName LIKE :s OR log.targetType LIKE :s OR log.targetId LIKE :s)',
        { s },
      );
    }
    if (params?.dateFrom) {
      qb.andWhere('log.createdAt >= :dateFrom', { dateFrom: new Date(params.dateFrom) });
    }
    if (params?.dateTo) {
      const end = new Date(params.dateTo);
      end.setDate(end.getDate() + 1);
      qb.andWhere('log.createdAt < :dateTo', { dateTo: end });
    }

    return qb.getMany();
  }

  async record(entry: RecordAuditEntry): Promise<void> {
    const log = this.auditLogs.create({
      action: entry.action,
      category: entry.category ?? null,
      actorId: entry.actorId ?? null,
      actorName: entry.actorName ?? null,
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
