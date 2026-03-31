import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Min,
} from 'class-validator';

import { MembershipCategory, MembershipStatus, PaymentPlan } from '../membership.enums';

export class CreateMemberDto {
  @ApiProperty()
  @IsString()
  @Length(2, 200)
  name!: string;

  @ApiProperty({ enum: MembershipCategory })
  @IsEnum(MembershipCategory)
  category!: MembershipCategory;

  @ApiProperty({ example: 'Football' })
  @IsString()
  @Length(2, 80)
  sport!: string;

  @ApiPropertyOptional({ enum: MembershipStatus })
  @IsOptional()
  @IsEnum(MembershipStatus)
  status?: MembershipStatus;

  @ApiPropertyOptional({ enum: PaymentPlan })
  @IsOptional()
  @IsEnum(PaymentPlan)
  plan?: PaymentPlan;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  memberCount?: number;

  @ApiPropertyOptional({ description: 'ISO date-time' })
  @IsOptional()
  @Type(() => Date)
  joinedAt?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(0, 120)
  digitalCardId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('4')
  facilityId?: string;
}

