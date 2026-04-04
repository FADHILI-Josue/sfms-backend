import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Public } from '../../common/decorators/public.decorator';
import type { AuthUser } from '../auth/types/auth-user.type';
import { AssignFacilityOwnerDto } from './dto/assign-facility-owner.dto';
import { CreateFacilityDto } from './dto/create-facility.dto';
import { FacilityDecisionDto } from './dto/facility-decision.dto';
import { ListFacilitiesQueryDto } from './dto/list-facilities.query.dto';
import { UpdateFacilityDto } from './dto/update-facility.dto';
import { FacilitiesService } from './facilities.service';

@ApiTags('Facilities')
@ApiBearerAuth()
@Controller({ path: 'facilities', version: '1' })
export class FacilitiesController {
  constructor(private readonly facilities: FacilitiesService) {}

  @Get()
  @Permissions('facilities.read')
  list(@CurrentUser() user: AuthUser, @Query() query: ListFacilitiesQueryDto) {
    return this.facilities.list(user, query);
  }

  @Post()
  @Permissions('facilities.create')
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateFacilityDto) {
    return this.facilities.create(user, dto);
  }

  @Get(':id')
  @Permissions('facilities.read')
  get(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.facilities.get(user, id);
  }

  @Patch(':id')
  @Permissions('facilities.update')
  update(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: UpdateFacilityDto) {
    return this.facilities.update(user, id, dto);
  }

  @Post(':id/assign-owner')
  @Permissions('facilities.update')
  assignOwner(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: AssignFacilityOwnerDto) {
    return this.facilities.assignOwner(user, id, dto.ownerId);
  }

  @Post(':id/approve')
  @Permissions('facilities.approve')
  approve(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.facilities.approve(user, id);
  }

  @Post(':id/reject')
  @Permissions('facilities.approve')
  reject(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: FacilityDecisionDto) {
    return this.facilities.reject(user, id, dto.reason);
  }

  @Delete(':id')
  @Permissions('facilities.delete')
  delete(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.facilities.delete(user, id);
  }
}

@ApiTags('Public')
@Controller({ path: 'public/facilities', version: '1' })
export class PublicFacilitiesController {
  constructor(private readonly facilities: FacilitiesService) {}

  @Public()
  @Get()
  list(@Query() query: ListFacilitiesQueryDto) {
    return this.facilities.listPublic(query);
  }
}
