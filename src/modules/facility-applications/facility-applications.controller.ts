import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Public } from '../../common/decorators/public.decorator';
import type { AuthUser } from '../auth/types/auth-user.type';
import { DecideFacilityApplicationDto } from './dto/decide-facility-application.dto';
import { SubmitFacilityApplicationDto } from './dto/submit-facility-application.dto';
import { FacilityApplicationsService } from './facility-applications.service';

@ApiTags('Public')
@Controller({ path: 'public/facility-applications', version: '1' })
export class PublicFacilityApplicationsController {
  constructor(private readonly apps: FacilityApplicationsService) {}

  @Public()
  @Post()
  submit(@Body() dto: SubmitFacilityApplicationDto) {
    return this.apps.submit(dto);
  }
}

@ApiTags('Facility Applications')
@ApiBearerAuth()
@Controller({ path: 'facility-applications', version: '1' })
export class FacilityApplicationsController {
  constructor(private readonly apps: FacilityApplicationsService) {}

  @Get()
  @Permissions('facilityApplications.read')
  list() {
    return this.apps.list();
  }

  @Post(':id/approve')
  @Permissions('facilityApplications.approve')
  approve(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.apps.approve(user, id);
  }

  @Post(':id/reject')
  @Permissions('facilityApplications.approve')
  reject(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: DecideFacilityApplicationDto,
  ) {
    return this.apps.reject(user, id, dto.reason);
  }
}

