import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { PermissionEntity } from './entities/permission.entity';
import { RoleEntity } from './entities/role.entity';
import { AccessControlService } from './access-control.service';
import { AccessControlController } from './access-control.controller';

@Module({
  imports: [TypeOrmModule.forFeature([RoleEntity, PermissionEntity])],
  controllers: [AccessControlController],
  providers: [AccessControlService],
  exports: [AccessControlService, TypeOrmModule],
})
export class AccessControlModule {}
