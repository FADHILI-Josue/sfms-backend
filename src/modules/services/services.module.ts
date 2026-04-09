import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { FacilitiesModule } from '../facilities/facilities.module';
import { ServiceProviderProfileEntity } from './entities/service-provider-profile.entity';
import { ServiceProgramEntity } from './entities/service-program.entity';
import { ServiceBeneficiaryEntity } from './entities/service-beneficiary.entity';
import { ServiceSessionEntity } from './entities/service-session.entity';
import { ServiceAttendanceEntity } from './entities/service-attendance.entity';
import { ServiceRatingEntity } from './entities/service-rating.entity';
import { ServicesController } from './services.controller';
import { ServicesService } from './services.service';

@Module({
  imports: [
    FacilitiesModule,
    TypeOrmModule.forFeature([
      ServiceProviderProfileEntity,
      ServiceProgramEntity,
      ServiceBeneficiaryEntity,
      ServiceSessionEntity,
      ServiceAttendanceEntity,
      ServiceRatingEntity,
    ]),
  ],
  controllers: [ServicesController],
  providers: [ServicesService],
  exports: [ServicesService],
})
export class ServicesModule {}
