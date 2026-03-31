import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, IsUUID, Length, Min } from 'class-validator';

import { PaymentMethod, PaymentStatus } from '../payment.enums';

export class CreatePaymentDto {
  @ApiProperty()
  @IsUUID('4')
  memberId!: string;

  @ApiPropertyOptional({ example: '2026-03' })
  @IsOptional()
  @IsString()
  @Length(0, 80)
  billingPeriod?: string;

  @ApiProperty({ description: 'Money in cents' })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  amountDueCents!: number;

  @ApiPropertyOptional({ description: 'Money in cents' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  amountPaidCents?: number;

  @ApiProperty({ enum: PaymentMethod })
  @IsEnum(PaymentMethod)
  method!: PaymentMethod;

  @ApiPropertyOptional({ enum: PaymentStatus })
  @IsOptional()
  @IsEnum(PaymentStatus)
  status?: PaymentStatus;

  @ApiPropertyOptional({ description: 'ISO date-time' })
  @IsOptional()
  @Type(() => Date)
  paidAt?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(0, 120)
  reference?: string;
}

