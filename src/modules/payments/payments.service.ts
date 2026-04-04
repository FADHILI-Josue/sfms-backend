import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import type { AuthUser } from '../auth/types/auth-user.type';
import { FacilityAccessService } from '../facilities/facility-access.service';
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
    private readonly access: FacilityAccessService,
  ) {}

  async list(user: AuthUser) {
    const items = await this.payments.find({
      order: { createdAt: 'DESC' },
      relations: { member: { facility: true } } as any,
      take: 500,
    });

    if (this.access.isSuperAdmin(user)) return items;

    const scope = await this.access.getScope(user);
    if (scope.facilityIds.length === 0) return [];

    return items.filter((p) => {
      const facilityId = (p.member as any)?.facilityId as string | null | undefined;
      if (!facilityId) return false;
      return scope.facilityIds.includes(facilityId);
    });
  }

  async get(user: AuthUser, id: string) {
    const payment = await this.payments.findOne({
      where: { id },
      relations: { member: { facility: true } } as any,
    });
    if (!payment) throw new NotFoundException('Payment not found.');

    if (!this.access.isSuperAdmin(user)) {
      const facilityId = (payment.member as any)?.facilityId as string | null | undefined;
      if (!facilityId) throw new NotFoundException('Payment not found.');
      const scope = await this.access.getScope(user);
      if (!scope.facilityIds.includes(facilityId)) throw new NotFoundException('Payment not found.');
    }

    return payment;
  }

  async create(user: AuthUser, dto: CreatePaymentDto) {
    const member = await this.members.findOne({ where: { id: dto.memberId }, relations: { facility: true } as any });
    if (!member) throw new BadRequestException('Member not found.');

    if (!this.access.isSuperAdmin(user)) {
      if (!member.facilityId) throw new BadRequestException('Member is not assigned to a facility.');
      const visible = await this.access.assertFacilityIdsVisible(user, [member.facilityId]);
      if (!visible) throw new BadRequestException('Member not found.');
    }

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

  async update(user: AuthUser, id: string, dto: UpdatePaymentDto) {
    const payment = await this.get(user, id);

    if (dto.memberId !== undefined) {
      const member = await this.members.findOne({ where: { id: dto.memberId }, relations: { facility: true } as any });
      if (!member) throw new BadRequestException('Member not found.');
      if (!this.access.isSuperAdmin(user)) {
        if (!member.facilityId) throw new BadRequestException('Member is not assigned to a facility.');
        const visible = await this.access.assertFacilityIdsVisible(user, [member.facilityId]);
        if (!visible) throw new BadRequestException('Member not found.');
      }
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

  async delete(user: AuthUser, id: string) {
    await this.get(user, id);
    await this.payments.delete({ id });
    return { ok: true };
  }
}
