import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { BookingEntity } from '../bookings/entities/booking.entity';
import { FacilityEntity } from '../facilities/entities/facility.entity';
import { MemberEntity } from '../memberships/entities/member.entity';
import { PaymentEntity } from '../payments/entities/payment.entity';
import { AnalyticsController } from './analytics.controller';

@Module({
  imports: [TypeOrmModule.forFeature([FacilityEntity, MemberEntity, BookingEntity, PaymentEntity])],
  controllers: [AnalyticsController],
})
export class AnalyticsModule {}
