import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { Permissions } from '../../common/decorators/permissions.decorator';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { BookingsService } from './bookings.service';

@ApiTags('Bookings')
@ApiBearerAuth()
@Controller({ path: 'bookings', version: '1' })
export class BookingsController {
  constructor(private readonly bookings: BookingsService) {}

  @Get()
  @Permissions('bookings.read')
  list() {
    return this.bookings.list();
  }

  @Post()
  @Permissions('bookings.create')
  create(@Body() dto: CreateBookingDto) {
    return this.bookings.create(dto);
  }

  @Get(':id')
  @Permissions('bookings.read')
  get(@Param('id') id: string) {
    return this.bookings.get(id);
  }

  @Patch(':id')
  @Permissions('bookings.update')
  update(@Param('id') id: string, @Body() dto: UpdateBookingDto) {
    return this.bookings.update(id, dto);
  }

  @Delete(':id')
  @Permissions('bookings.delete')
  delete(@Param('id') id: string) {
    return this.bookings.delete(id);
  }
}
