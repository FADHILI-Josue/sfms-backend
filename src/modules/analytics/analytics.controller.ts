import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Permissions } from '../../common/decorators/permissions.decorator';
import { BookingEntity } from '../bookings/entities/booking.entity';
import { FacilityEntity } from '../facilities/entities/facility.entity';
import { MemberEntity } from '../memberships/entities/member.entity';
import { PaymentEntity } from '../payments/entities/payment.entity';

@ApiTags('Analytics')
@ApiBearerAuth()
@Controller({ path: 'analytics', version: '1' })
export class AnalyticsController {
  constructor(
    @InjectRepository(FacilityEntity) private readonly facilities: Repository<FacilityEntity>,
    @InjectRepository(MemberEntity) private readonly members: Repository<MemberEntity>,
    @InjectRepository(BookingEntity) private readonly bookings: Repository<BookingEntity>,
    @InjectRepository(PaymentEntity) private readonly payments: Repository<PaymentEntity>,
  ) {}

  @Get('overview')
  @Permissions('analytics.read')
  async overview() {
    const [facilityCount, memberCount, bookingCount, paymentCount] = await Promise.all([
      this.facilities.count(),
      this.members.count(),
      this.bookings.count(),
      this.payments.count(),
    ]);

    return {
      facilities: facilityCount,
      members: memberCount,
      bookings: bookingCount,
      payments: paymentCount,
    };
  }
}
