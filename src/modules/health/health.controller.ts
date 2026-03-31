import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService } from '@nestjs/terminus';

import { Public } from '../../common/decorators/public.decorator';

@Controller({ path: 'health', version: '1' })
export class HealthController {
  constructor(private readonly health: HealthCheckService) {}

  @Get()
  @Public()
  @HealthCheck()
  check() {
    return this.health.check([]);
  }
}
