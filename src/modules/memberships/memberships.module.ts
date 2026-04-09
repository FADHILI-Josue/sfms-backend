import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { FacilitiesModule } from '../facilities/facilities.module';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { FacilityEntity } from '../facilities/entities/facility.entity';
import { MemberEntity } from './entities/member.entity';
import { MembershipPlanEntity } from './entities/membership-plan.entity';
import { MembershipDiscountEntity } from './entities/membership-discount.entity';
import { MembershipsController } from './memberships.controller';
import { MembershipsService } from './memberships.service';
import { MembershipPlansController } from './membership-plans.controller';
import { MembershipPlansService } from './membership-plans.service';
import { MembershipDiscountsController } from './membership-discounts.controller';
import { MembershipDiscountsService } from './membership-discounts.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([MemberEntity, MembershipPlanEntity, MembershipDiscountEntity, FacilityEntity]),
    FacilitiesModule,
    AuditLogsModule,
  ],
  controllers: [MembershipsController, MembershipPlansController, MembershipDiscountsController],
  providers: [MembershipsService, MembershipPlansService, MembershipDiscountsService],
})
export class MembershipsModule {}
