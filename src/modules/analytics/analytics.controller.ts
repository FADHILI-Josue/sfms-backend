import { Controller, Get, Param } from '@nestjs/common';
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

const SPORT_COLORS = [
  'hsl(82, 85%, 55%)',
  'hsl(200, 80%, 55%)',
  'hsl(38, 92%, 55%)',
  'hsl(280, 70%, 60%)',
  'hsl(0, 72%, 55%)',
  'hsl(170, 60%, 50%)',
  'hsl(330, 70%, 55%)',
  'hsl(50, 85%, 50%)',
];

const DAY_ORDER = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

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

  @Get('revenue-trend')
  @Permissions('analytics.read')
  async revenueTrend(@CurrentUser() user: AuthUser) {
    const qb = this.payments
      .createQueryBuilder('p')
      .select("TO_CHAR(DATE_TRUNC('month', p.paidAt), 'Mon')", 'month')
      .addSelect("DATE_TRUNC('month', p.paidAt)", 'monthDate')
      .addSelect('SUM(p.amountPaidCents)', 'revenue')
      .where("p.status = 'PAID'")
      .andWhere("p.paidAt >= NOW() - INTERVAL '6 months'")
      .groupBy("DATE_TRUNC('month', p.paidAt)")
      .orderBy("DATE_TRUNC('month', p.paidAt)", 'ASC');

    if (!this.access.isSuperAdmin(user)) {
      const scope = await this.access.getScope(user);
      if (scope.facilityIds.length === 0) return [];
      // Revenue is on payments linked to members; filter by memberId via subquery is complex,
      // so for non-super-admin we return all payments linked to their members' facility
      qb.innerJoin('p.member', 'm').andWhere('m.facilityId IN (:...ids)', { ids: scope.facilityIds });
    }

    const rows = await qb.getRawMany();
    return rows.map((r) => ({
      month: r.month as string,
      revenue: Math.round(Number(r.revenue) / 100),
    }));
  }

  @Get('sport-distribution')
  @Permissions('analytics.read')
  async sportDistribution(@CurrentUser() user: AuthUser) {
    const qb = this.members
      .createQueryBuilder('m')
      .select('m.sport', 'name')
      .addSelect('COUNT(*)', 'count')
      .groupBy('m.sport')
      .orderBy('count', 'DESC')
      .limit(8);

    if (!this.access.isSuperAdmin(user)) {
      const scope = await this.access.getScope(user);
      if (scope.facilityIds.length === 0) return [];
      qb.andWhere('m.facilityId IN (:...ids)', { ids: scope.facilityIds });
    }

    const rows = await qb.getRawMany();
    const total = rows.reduce((sum, r) => sum + Number(r.count), 0);

    return rows.map((r, i) => ({
      name: r.name as string,
      value: total > 0 ? Math.round((Number(r.count) / total) * 100) : 0,
      color: SPORT_COLORS[i % SPORT_COLORS.length],
    }));
  }

  @Get('facility/:facilityId/revenue-trend')
  @Permissions('analytics.read')
  async facilityRevenueTrend(@CurrentUser() user: AuthUser, @Param('facilityId') facilityId: string) {
    if (!this.access.isSuperAdmin(user)) {
      const scope = await this.access.getScope(user);
      if (!scope.facilityIds.includes(facilityId)) return [];
    }

    const rows = await this.payments
      .createQueryBuilder('p')
      .innerJoin('p.member', 'm')
      .select("TO_CHAR(DATE_TRUNC('month', p.paidAt), 'Mon')", 'month')
      .addSelect("DATE_TRUNC('month', p.paidAt)", 'monthDate')
      .addSelect('SUM(p.amountPaidCents)', 'revenue')
      .addSelect('COUNT(DISTINCT p.id)', 'transactions')
      .where("p.status = 'PAID'")
      .andWhere("p.paidAt >= NOW() - INTERVAL '6 months'")
      .andWhere('m.facilityId = :facilityId', { facilityId })
      .groupBy("DATE_TRUNC('month', p.paidAt)")
      .orderBy("DATE_TRUNC('month', p.paidAt)", 'ASC')
      .getRawMany();

    return rows.map((r) => ({
      month: r.month as string,
      revenue: Math.round(Number(r.revenue) / 100),
      transactions: Number(r.transactions),
    }));
  }

  @Get('weekly-utilization')
  @Permissions('analytics.read')
  async weeklyUtilization(@CurrentUser() user: AuthUser) {
    const qb = this.bookings
      .createQueryBuilder('b')
      .innerJoin('b.facility', 'f')
      .select("TO_CHAR(b.startAt, 'Dy')", 'day')
      .addSelect('EXTRACT(DOW FROM b.startAt)', 'dow')
      .addSelect('f.type', 'type')
      .addSelect('COUNT(*)', 'count')
      .where("b.startAt >= NOW() - INTERVAL '28 days'")
      .groupBy("TO_CHAR(b.startAt, 'Dy'), EXTRACT(DOW FROM b.startAt), f.type")
      .orderBy('EXTRACT(DOW FROM b.startAt)', 'ASC');

    if (!this.access.isSuperAdmin(user)) {
      const scope = await this.access.getScope(user);
      if (scope.facilityIds.length === 0) {
        return DAY_ORDER.map((day) => ({ day, indoor: 0, outdoor: 0 }));
      }
      qb.andWhere('b.facilityId IN (:...ids)', { ids: scope.facilityIds });
    }

    const rows = await qb.getRawMany();

    const map: Record<string, { indoor: number; outdoor: number }> = {};
    for (const d of DAY_ORDER) map[d] = { indoor: 0, outdoor: 0 };

    for (const r of rows) {
      const day = (r.day as string).trim();
      if (!map[day]) map[day] = { indoor: 0, outdoor: 0 };
      if ((r.type as string) === 'INDOOR') map[day].indoor += Number(r.count);
      else map[day].outdoor += Number(r.count);
    }

    return DAY_ORDER.map((day) => ({ day, ...map[day] }));
  }
}
