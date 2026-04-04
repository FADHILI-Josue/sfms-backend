import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import type { AuthUser } from '../auth/types/auth-user.type';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { PaymentsService } from './payments.service';

@ApiTags('Payments')
@ApiBearerAuth()
@Controller({ path: 'payments', version: '1' })
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @Get()
  @Permissions('payments.read')
  list(@CurrentUser() user: AuthUser) {
    return this.payments.list(user);
  }

  @Post()
  @Permissions('payments.create')
  create(@CurrentUser() user: AuthUser, @Body() dto: CreatePaymentDto) {
    return this.payments.create(user, dto);
  }

  @Get(':id')
  @Permissions('payments.read')
  get(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.payments.get(user, id);
  }

  @Patch(':id')
  @Permissions('payments.update')
  update(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: UpdatePaymentDto) {
    return this.payments.update(user, id, dto);
  }

  @Delete(':id')
  @Permissions('payments.delete')
  delete(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.payments.delete(user, id);
  }
}
