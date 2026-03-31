import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { Permissions } from '../../common/decorators/permissions.decorator';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';
import { toUserResponse } from './users.mapper';

@ApiTags('Users')
@ApiBearerAuth()
@Controller({ path: 'users', version: '1' })
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  @Permissions('users.read')
  async list() {
    const users = await this.users.list();
    return users.map(toUserResponse);
  }

  @Post()
  @Permissions('users.create')
  async create(@Body() dto: CreateUserDto) {
    const user = await this.users.create(dto);
    return toUserResponse(user);
  }

  @Get(':id')
  @Permissions('users.read')
  async get(@Param('id') id: string) {
    const user = await this.users.get(id);
    return toUserResponse(user);
  }

  @Patch(':id')
  @Permissions('users.update')
  async update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    const user = await this.users.update(id, dto);
    return toUserResponse(user);
  }

  @Delete(':id')
  @Permissions('users.delete')
  delete(@Param('id') id: string) {
    return this.users.delete(id);
  }
}
