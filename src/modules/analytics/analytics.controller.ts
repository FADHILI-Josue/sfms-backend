import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import type { AuthUser } from '../auth/types/auth-user.type';
import { BookingEntity } from '../bookings/entities/booking.entity';
import { FacilityAccessService } from '../facilities/facility-access.service';
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
    private readonly access: FacilityAccessService,
  ) {}

  @Get('overview')
  @Permissions('analytics.read')
  async overview(@CurrentUser() user: AuthUser) {
    if (this.access.isSuperAdmin(user)) {
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

    const scope = await this.access.getScope(user);
    if (scope.facilityIds.length === 0) {
      return { facilities: 0, members: 0, bookings: 0, payments: 0 };
    }

    const [facilityCount, memberCount, bookingCount] = await Promise.all([
      this.facilities.count({ where: { id: In(scope.facilityIds) } }),
      this.members.count({ where: { facilityId: In(scope.facilityIds) } }),
      this.bookings.count({ where: { facilityId: In(scope.facilityIds) } }),
    ]);

    const payments = await this.payments.find({ relations: { member: true } as any, take: 2000 });
    const paymentCount = payments.filter((p) => {
      const facilityId = (p.member as any)?.facilityId as string | null | undefined;
      return facilityId ? scope.facilityIds.includes(facilityId) : false;
    }).length;

    return { facilities: facilityCount, members: memberCount, bookings: bookingCount, payments: paymentCount };
  }
}
