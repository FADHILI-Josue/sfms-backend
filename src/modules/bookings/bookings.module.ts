import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { FacilityEntity } from '../facilities/entities/facility.entity';
import { MemberEntity } from '../memberships/entities/member.entity';
import { BookingEntity } from './entities/booking.entity';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';

@Module({
  imports: [TypeOrmModule.forFeature([BookingEntity, FacilityEntity, MemberEntity])],
  controllers: [BookingsController],
  providers: [BookingsService],
})
export class BookingsModule {}
