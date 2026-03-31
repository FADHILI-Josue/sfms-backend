import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { Permissions } from '../../common/decorators/permissions.decorator';
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
  list() {
    return this.memberships.list();
  }

  @Post()
  @Permissions('memberships.create')
  create(@Body() dto: CreateMemberDto) {
    return this.memberships.create(dto);
  }

  @Get(':id')
  @Permissions('memberships.read')
  get(@Param('id') id: string) {
    return this.memberships.get(id);
  }

  @Patch(':id')
  @Permissions('memberships.update')
  update(@Param('id') id: string, @Body() dto: UpdateMemberDto) {
    return this.memberships.update(id, dto);
  }

  @Delete(':id')
  @Permissions('memberships.delete')
  delete(@Param('id') id: string) {
    return this.memberships.delete(id);
  }
}
