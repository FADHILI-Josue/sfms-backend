import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { RoleEntity } from '../access-control/entities/role.entity';
import { FacilityEntity } from '../facilities/entities/facility.entity';
import { UserEntity } from '../users/entities/user.entity';
import { FacilityApplicationEntity } from './entities/facility-application.entity';
import {
  FacilityApplicationsController,
  PublicFacilityApplicationsController,
} from './facility-applications.controller';
import { FacilityApplicationsService } from './facility-applications.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      FacilityApplicationEntity,
      UserEntity,
      RoleEntity,
      FacilityEntity,
    ]),
  ],
  controllers: [PublicFacilityApplicationsController, FacilityApplicationsController],
  providers: [FacilityApplicationsService],
})
export class FacilityApplicationsModule {}

