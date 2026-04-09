import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import type { AuthUser } from '../auth/types/auth-user.type';
import { MembershipDiscountsService } from './membership-discounts.service';

@ApiTags('Membership Discounts')
@ApiBearerAuth()
@Controller({ path: 'membership-discounts', version: '1' })
export class MembershipDiscountsController {
  constructor(private readonly discounts: MembershipDiscountsService) {}

  @Get()
  @Permissions('memberships.read')
  list(@CurrentUser() user: AuthUser, @Query('facilityId') facilityId?: string) {
    return this.discounts.listForUser(user, facilityId);
  }

  @Post()
  @Permissions('memberships.create')
  create(@CurrentUser() user: AuthUser, @Body() dto: any) {
    return this.discounts.create(user, dto);
  }

  @Patch(':id')
  @Permissions('memberships.update')
  update(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: any) {
    return this.discounts.update(user, id, dto);
  }

  @Delete(':id')
  @Permissions('memberships.delete')
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.discounts.remove(user, id);
  }
}
