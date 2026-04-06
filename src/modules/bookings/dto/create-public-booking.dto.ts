import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEmail, IsEnum, IsInt, IsOptional, IsString, IsUUID, Length, Min } from 'class-validator';
import { BookingType } from '../booking.enums';

export class CreatePublicBookingDto {
  @ApiProperty()
  @IsUUID('4')
  facilityId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('4')
  courtId?: string;

  @ApiProperty()
  @IsString()
  guestName!: string;

  @ApiProperty()
  @IsEmail()
  guestEmail!: string;

  @ApiProperty()
  @IsString()
  guestPhone!: string;

  @ApiProperty({ enum: BookingType })
  @IsEnum(BookingType)
  type!: BookingType;

  @ApiProperty()
  @Type(() => Date)
  startAt!: Date;

  @ApiProperty()
  @Type(() => Date)
  endAt!: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(0, 240)
  notes?: string;

  @ApiProperty()
  @IsString()
  paymentMethod!: string;

  @ApiProperty()
  @IsInt()
  @Min(0)
  amountCents!: number;
}
