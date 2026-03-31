import { Controller, Get } from '@nestjs/common';
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
  list() {
    return this.audit.list();
  }
}
