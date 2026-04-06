import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import type { AuthUser } from '../auth/types/auth-user.type';
import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { MembershipsService } from './memberships.service';

@ApiTags('Memberships')
@ApiBearerAuth()
@Controller({ path: 'memberships', version: '1' })
export class MembershipsController {
  constructor(private readonly memberships: MembershipsService) {}

  @Get()
  @Permissions('memberships.read')
  list(@CurrentUser() user: AuthUser, @Query('facilityId') facilityId?: string) {
    return this.memberships.list(user, facilityId);
  }

  @Post()
  @Permissions('memberships.create')
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateMemberDto) {
    return this.memberships.create(user, dto);
  }

  @Get(':id')
  @Permissions('memberships.read')
  get(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.memberships.get(user, id);
  }

  @Patch(':id')
  @Permissions('memberships.update')
  update(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: UpdateMemberDto) {
    return this.memberships.update(user, id, dto);
  }

  @Delete(':id')
  @Permissions('memberships.delete')
  delete(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.memberships.delete(user, id);
  }
}
