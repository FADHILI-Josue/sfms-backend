import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import { RoleEntity } from '../access-control/entities/role.entity';
import { hashSecret } from '../../common/security/password-hasher';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserEntity } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity) private readonly users: Repository<UserEntity>,
    @InjectRepository(RoleEntity) private readonly roles: Repository<RoleEntity>,
  ) {}

  async list() {
    return this.users.find({ relations: { roles: true } });
  }

  async get(id: string) {
    const user = await this.users.findOne({ where: { id }, relations: { roles: true } });
    if (!user) throw new NotFoundException('User not found.');
    return user;
  }

  async create(dto: CreateUserDto) {
    const passwordHash = await hashSecret(dto.password);
    const user = this.users.create({
      email: dto.email.toLowerCase(),
      fullName: dto.fullName,
      passwordHash,
      roles: [],
    });

    if (dto.roleIds?.length) {
      const roles = await this.roles.find({ where: { id: In(dto.roleIds) } });
      if (roles.length !== dto.roleIds.length) throw new BadRequestException('One or more roles are invalid.');
      user.roles = roles;
    }

    const saved = await this.users.save(user);
    return this.get(saved.id);
  }

  async update(id: string, dto: UpdateUserDto) {
    const user = await this.get(id);

    if (dto.email) user.email = dto.email.toLowerCase();
    if (dto.fullName) user.fullName = dto.fullName;
    if (dto.password) user.passwordHash = await hashSecret(dto.password);

    if (dto.roleIds) {
      const roles = await this.roles.find({ where: { id: In(dto.roleIds) } });
      if (roles.length !== dto.roleIds.length) throw new BadRequestException('One or more roles are invalid.');
      user.roles = roles;
    }

    await this.users.save(user);
    return this.get(id);
  }

  async delete(id: string) {
    const user = await this.users.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found.');

    await this.users.delete({ id });
    return { ok: true };
  }
}
