import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Public } from '../../common/decorators/public.decorator';
import type { AuthUser } from '../auth/types/auth-user.type';
import { CreatePublicBookingDto } from './dto/create-public-booking.dto';
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
  list(@CurrentUser() user: AuthUser) {
    return this.bookings.list(user);
  }

  @Post()
  @Permissions('bookings.create')
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateBookingDto) {
    return this.bookings.create(user, dto);
  }

  @Get(':id')
  @Permissions('bookings.read')
  get(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.bookings.get(user, id);
  }

  @Patch(':id')
  @Permissions('bookings.update')
  update(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: UpdateBookingDto) {
    return this.bookings.update(user, id, dto);
  }

  @Delete(':id')
  @Permissions('bookings.delete')
  delete(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.bookings.delete(user, id);
  }
}

@ApiTags('Public Bookings')
@Controller({ path: 'public/bookings', version: '1' })
export class PublicBookingsController {
  constructor(private readonly bookings: BookingsService) {}

  @Public()
  @Post()
  createPublic(@Body() dto: CreatePublicBookingDto) {
    return this.bookings.createPublic(dto);
  }
}
