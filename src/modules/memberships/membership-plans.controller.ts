import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Public } from '../../common/decorators/public.decorator';
import type { AuthUser } from '../auth/types/auth-user.type';
import { MembershipPlansService } from './membership-plans.service';

@ApiTags('Membership Plans')
@ApiBearerAuth()
@Controller({ path: 'membership-plans', version: '1' })
export class MembershipPlansController {
  constructor(private readonly plans: MembershipPlansService) {}

  /** Public: list active plans for a facility (no auth needed) */
  @Get('public')
  @Public()
  listPublic(@Query('facilityId') facilityId?: string) {
    if (!facilityId) return [];
    return this.plans.listByFacility(facilityId);
  }

  @Get()
  @Permissions('memberships.read')
  list(@CurrentUser() user: AuthUser, @Query('facilityId') facilityId?: string) {
    return this.plans.listForUser(user, facilityId);
  }

  @Post()
  @Permissions('memberships.create')
  create(@CurrentUser() user: AuthUser, @Body() dto: any) {
    return this.plans.create(user, dto);
  }

  @Patch(':id')
  @Permissions('memberships.update')
  update(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: any) {
    return this.plans.update(user, id, dto);
  }

  @Delete(':id')
  @Permissions('memberships.delete')
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.plans.remove(user, id);
  }
}
