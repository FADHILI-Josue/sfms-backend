import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { FacilitiesModule } from '../facilities/facilities.module';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { MemberEntity } from '../memberships/entities/member.entity';
import { PaymentEntity } from './entities/payment.entity';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';

@Module({
  imports: [TypeOrmModule.forFeature([PaymentEntity, MemberEntity]), FacilitiesModule, AuditLogsModule],
  controllers: [PaymentsController],
  providers: [PaymentsService],
})
export class PaymentsModule {}
