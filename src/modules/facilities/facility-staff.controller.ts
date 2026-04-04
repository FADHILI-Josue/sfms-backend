import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import type { AuthUser } from '../auth/types/auth-user.type';
import { UpsertFacilityStaffDto } from './dto/upsert-facility-staff.dto';
import { FacilityStaffService } from './facility-staff.service';

@ApiTags('Facility Staff')
@ApiBearerAuth()
@Controller({ path: 'facilities', version: '1' })
export class FacilityStaffController {
  constructor(private readonly staff: FacilityStaffService) {}

  @Get(':facilityId/staff')
  @Permissions('facilityStaff.read')
  list(@CurrentUser() user: AuthUser, @Param('facilityId') facilityId: string) {
    return this.staff.listForFacility(user, facilityId);
  }

  @Post(':facilityId/staff')
  @Permissions('facilityStaff.create')
  upsert(
    @CurrentUser() user: AuthUser,
    @Param('facilityId') facilityId: string,
    @Body() dto: UpsertFacilityStaffDto,
  ) {
    return this.staff.upsert(user, facilityId, dto);
  }

  @Delete(':facilityId/staff/:assignmentId')
  @Permissions('facilityStaff.delete')
  deactivate(
    @CurrentUser() user: AuthUser,
    @Param('facilityId') facilityId: string,
    @Param('assignmentId') assignmentId: string,
  ) {
    return this.staff.deactivate(user, facilityId, assignmentId);
  }
}

