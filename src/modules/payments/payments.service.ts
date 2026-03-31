import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { MemberEntity } from '../memberships/entities/member.entity';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { PaymentEntity } from './entities/payment.entity';
import { PaymentStatus } from './payment.enums';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(PaymentEntity) private readonly payments: Repository<PaymentEntity>,
    @InjectRepository(MemberEntity) private readonly members: Repository<MemberEntity>,
  ) {}

  list() {
    return this.payments.find({ order: { createdAt: 'DESC' } });
  }

  async get(id: string) {
    const payment = await this.payments.findOne({ where: { id } });
    if (!payment) throw new NotFoundException('Payment not found.');
    return payment;
  }

  async create(dto: CreatePaymentDto) {
    const memberOk = await this.members.exist({ where: { id: dto.memberId } });
    if (!memberOk) throw new BadRequestException('Member not found.');

    const status =
      dto.status ?? (dto.amountPaidCents && dto.amountPaidCents >= dto.amountDueCents ? PaymentStatus.PAID : PaymentStatus.PENDING);

    const payment = this.payments.create({
      memberId: dto.memberId,
      billingPeriod: dto.billingPeriod ?? null,
      amountDueCents: dto.amountDueCents,
      amountPaidCents: dto.amountPaidCents ?? 0,
      method: dto.method,
      status,
      paidAt: dto.paidAt ?? null,
      reference: dto.reference ?? null,
    });

    return this.payments.save(payment);
  }

  async update(id: string, dto: UpdatePaymentDto) {
    const payment = await this.get(id);

    if (dto.memberId !== undefined) {
      const memberOk = await this.members.exist({ where: { id: dto.memberId } });
      if (!memberOk) throw new BadRequestException('Member not found.');
      payment.memberId = dto.memberId;
    }

    if (dto.billingPeriod !== undefined) payment.billingPeriod = dto.billingPeriod ?? null;
    if (dto.amountDueCents !== undefined) payment.amountDueCents = dto.amountDueCents;
    if (dto.amountPaidCents !== undefined) payment.amountPaidCents = dto.amountPaidCents ?? 0;
    if (dto.method !== undefined) payment.method = dto.method;
    if (dto.status !== undefined) payment.status = dto.status;
    if (dto.paidAt !== undefined) payment.paidAt = dto.paidAt ?? null;
    if (dto.reference !== undefined) payment.reference = dto.reference ?? null;

    return this.payments.save(payment);
  }

  async delete(id: string) {
    await this.get(id);
    await this.payments.delete({ id });
    return { ok: true };
  }
}

