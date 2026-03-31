import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsOptional, IsString, IsUUID, Length } from 'class-validator';

import { BookingStatus, BookingType, Recurrence } from '../booking.enums';

export class CreateBookingDto {
  @ApiProperty()
  @IsUUID('4')
  facilityId!: string;

  @ApiProperty({ description: 'Member/team id' })
  @IsUUID('4')
  memberId!: string;

  @ApiProperty({ enum: BookingType })
  @IsEnum(BookingType)
  type!: BookingType;

  @ApiPropertyOptional({ enum: BookingStatus })
  @IsOptional()
  @IsEnum(BookingStatus)
  status?: BookingStatus;

  @ApiProperty({ description: 'ISO date-time' })
  @Type(() => Date)
  startAt!: Date;

  @ApiProperty({ description: 'ISO date-time' })
  @Type(() => Date)
  endAt!: Date;

  @ApiPropertyOptional({ enum: Recurrence })
  @IsOptional()
  @IsEnum(Recurrence)
  recurrence?: Recurrence;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(0, 240)
  notes?: string;
}

