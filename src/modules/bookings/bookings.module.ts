import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { FacilitiesModule } from '../facilities/facilities.module';
import { CourtEntity } from '../facilities/entities/court.entity';
import { FacilityEntity } from '../facilities/entities/facility.entity';
import { MemberEntity } from '../memberships/entities/member.entity';
import { BookingEntity } from './entities/booking.entity';
import { PaymentEntity } from '../payments/entities/payment.entity';
import { BookingsController, PublicBookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([BookingEntity, FacilityEntity, CourtEntity, MemberEntity, PaymentEntity]),
    FacilitiesModule,
  ],
  controllers: [BookingsController, PublicBookingsController],
  providers: [BookingsService],
})
export class BookingsModule {}
