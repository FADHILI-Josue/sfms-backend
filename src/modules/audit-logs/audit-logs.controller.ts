import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { Permissions } from '../../common/decorators/permissions.decorator';
import { AuditLogsService } from './audit-logs.service';

@ApiTags('Audit Logs')
@ApiBearerAuth()
@Controller({ path: 'audit-logs', version: '1' })
export class AuditLogsController {
  constructor(private readonly audit: AuditLogsService) {}

  @Get()
  @Permissions('audit.read')
  list(
    @Query('category') category?: string,
    @Query('severity') severity?: string,
    @Query('search') search?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('limit') limit?: string,
  ) {
    return this.audit.list({
      category,
      severity,
      search,
      dateFrom,
      dateTo,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }
}
