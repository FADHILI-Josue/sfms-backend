import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import { PermissionEntity } from './entities/permission.entity';
import { RoleEntity } from './entities/role.entity';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@Injectable()
export class AccessControlService {
  constructor(
    @InjectRepository(RoleEntity) private readonly roles: Repository<RoleEntity>,
    @InjectRepository(PermissionEntity)
    private readonly permissions: Repository<PermissionEntity>,
  ) {}

  async listRoles() {
    return this.roles.find({ relations: { permissions: true } });
  }

  async getRole(id: string) {
    const role = await this.roles.findOne({ where: { id }, relations: { permissions: true } });
    if (!role) throw new NotFoundException('Role not found.');
    return role;
  }

  async createRole(dto: CreateRoleDto) {
    const role = this.roles.create({
      name: dto.name,
      description: dto.description ?? null,
      isSystem: false,
    });

    if (dto.permissionKeys?.length) {
      const perms = await this.permissions.find({ where: { key: In(dto.permissionKeys) } });
      if (perms.length !== dto.permissionKeys.length) {
        throw new BadRequestException('One or more permission keys are invalid.');
      }
      role.permissions = perms;
    }

    return this.roles.save(role);
  }

  async updateRole(id: string, dto: UpdateRoleDto) {
    const role = await this.getRole(id);

    if (dto.name) role.name = dto.name;
    if (dto.description !== undefined) role.description = dto.description ?? null;

    if (dto.permissionKeys) {
      const perms = await this.permissions.find({ where: { key: In(dto.permissionKeys) } });
      if (perms.length !== dto.permissionKeys.length) {
        throw new BadRequestException('One or more permission keys are invalid.');
      }
      role.permissions = perms;
    }

    return this.roles.save(role);
  }

  async deleteRole(id: string) {
    const role = await this.roles.findOne({ where: { id } });
    if (!role) throw new NotFoundException('Role not found.');

    if (role.isSystem) throw new BadRequestException('System roles cannot be deleted.');

    await this.roles.delete({ id });
    return { ok: true };
  }

  async listPermissions() {
    return this.permissions.find({ order: { key: 'ASC' } });
  }

  async createPermission(dto: CreatePermissionDto) {
    const permission = this.permissions.create({
      key: dto.key,
      description: dto.description ?? null,
    });

    return this.permissions.save(permission);
  }
}

