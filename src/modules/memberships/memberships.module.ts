import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { FacilityEntity } from '../facilities/entities/facility.entity';
import { MemberEntity } from './entities/member.entity';
import { MembershipsController } from './memberships.controller';
import { MembershipsService } from './memberships.service';

@Module({
  imports: [TypeOrmModule.forFeature([MemberEntity, FacilityEntity])],
  controllers: [MembershipsController],
  providers: [MembershipsService],
})
export class MembershipsModule {}
