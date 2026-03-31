import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { Permissions } from '../../common/decorators/permissions.decorator';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { AccessControlService } from './access-control.service';

@ApiTags('Access Control')
@ApiBearerAuth()
@Controller({ path: 'access-control', version: '1' })
export class AccessControlController {
  constructor(private readonly ac: AccessControlService) {}

  @Get('roles')
  @Permissions('roles.read')
  listRoles() {
    return this.ac.listRoles();
  }

  @Post('roles')
  @Permissions('roles.create')
  createRole(@Body() dto: CreateRoleDto) {
    return this.ac.createRole(dto);
  }

  @Get('roles/:id')
  @Permissions('roles.read')
  getRole(@Param('id') id: string) {
    return this.ac.getRole(id);
  }

  @Patch('roles/:id')
  @Permissions('roles.update')
  updateRole(@Param('id') id: string, @Body() dto: UpdateRoleDto) {
    return this.ac.updateRole(id, dto);
  }

  @Delete('roles/:id')
  @Permissions('roles.delete')
  deleteRole(@Param('id') id: string) {
    return this.ac.deleteRole(id);
  }

  @Get('permissions')
  @Permissions('permissions.read')
  listPermissions() {
    return this.ac.listPermissions();
  }

  @Post('permissions')
  @Permissions('permissions.create')
  createPermission(@Body() dto: CreatePermissionDto) {
    return this.ac.createPermission(dto);
  }
}
