import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { Permissions } from '../../common/decorators/permissions.decorator';
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
  list() {
    return this.payments.list();
  }

  @Post()
  @Permissions('payments.create')
  create(@Body() dto: CreatePaymentDto) {
    return this.payments.create(dto);
  }

  @Get(':id')
  @Permissions('payments.read')
  get(@Param('id') id: string) {
    return this.payments.get(id);
  }

  @Patch(':id')
  @Permissions('payments.update')
  update(@Param('id') id: string, @Body() dto: UpdatePaymentDto) {
    return this.payments.update(id, dto);
  }

  @Delete(':id')
  @Permissions('payments.delete')
  delete(@Param('id') id: string) {
    return this.payments.delete(id);
  }
}
