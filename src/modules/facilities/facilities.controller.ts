import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { Permissions } from '../../common/decorators/permissions.decorator';
import { CreateFacilityDto } from './dto/create-facility.dto';
import { UpdateFacilityDto } from './dto/update-facility.dto';
import { FacilitiesService } from './facilities.service';

@ApiTags('Facilities')
@ApiBearerAuth()
@Controller({ path: 'facilities', version: '1' })
export class FacilitiesController {
  constructor(private readonly facilities: FacilitiesService) {}

  @Get()
  @Permissions('facilities.read')
  list() {
    return this.facilities.list();
  }

  @Post()
  @Permissions('facilities.create')
  create(@Body() dto: CreateFacilityDto) {
    return this.facilities.create(dto);
  }

  @Get(':id')
  @Permissions('facilities.read')
  get(@Param('id') id: string) {
    return this.facilities.get(id);
  }

  @Patch(':id')
  @Permissions('facilities.update')
  update(@Param('id') id: string, @Body() dto: UpdateFacilityDto) {
    return this.facilities.update(id, dto);
  }

  @Delete(':id')
  @Permissions('facilities.delete')
  delete(@Param('id') id: string) {
    return this.facilities.delete(id);
  }
}
