import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import type { AuthUser } from '../auth/types/auth-user.type';
import { CreateCourtDto } from './dto/create-court.dto';
import { UpdateCourtDto } from './dto/update-court.dto';
import { CourtsService } from './courts.service';

@ApiTags('Courts')
@ApiBearerAuth()
@Controller({ path: 'facilities', version: '1' })
export class CourtsController {
  constructor(private readonly courts: CourtsService) {}

  @Get(':facilityId/courts')
  @Permissions('courts.read')
  list(@CurrentUser() user: AuthUser, @Param('facilityId') facilityId: string) {
    return this.courts.listForFacility(user, facilityId);
  }

  @Post(':facilityId/courts')
  @Permissions('courts.create')
  create(
    @CurrentUser() user: AuthUser,
    @Param('facilityId') facilityId: string,
    @Body() dto: CreateCourtDto,
  ) {
    return this.courts.create(user, facilityId, dto);
  }

  @Get('courts/:id')
  @Permissions('courts.read')
  get(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.courts.get(user, id);
  }

  @Patch('courts/:id')
  @Permissions('courts.update')
  update(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: UpdateCourtDto) {
    return this.courts.update(user, id, dto);
  }

  @Delete('courts/:id')
  @Permissions('courts.delete')
  delete(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.courts.delete(user, id);
  }
}

