import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { RoleEntity } from '../access-control/entities/role.entity';
import { UserEntity } from '../users/entities/user.entity';
import { BookingEntity } from '../bookings/entities/booking.entity';
import { FacilityEntity } from './entities/facility.entity';
import { CourtEntity } from './entities/court.entity';
import { FacilityStaffEntity } from './entities/facility-staff.entity';
import { CourtsController, PublicCourtsController } from './courts.controller';
import { FacilityStaffController } from './facility-staff.controller';
import { FacilitiesController, PublicFacilitiesController } from './facilities.controller';
import { FacilitiesService } from './facilities.service';
import { CourtsService } from './courts.service';
import { FacilityAccessService } from './facility-access.service';
import { FacilityStaffService } from './facility-staff.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      FacilityEntity,
      CourtEntity,
      FacilityStaffEntity,
      BookingEntity,
      UserEntity,
      RoleEntity,
    ]),
  ],
  controllers: [FacilitiesController, PublicFacilitiesController, CourtsController, PublicCourtsController, FacilityStaffController],
  providers: [FacilitiesService, FacilityAccessService, CourtsService, FacilityStaffService],
  exports: [FacilitiesService, FacilityAccessService],
})
export class FacilitiesModule {}
