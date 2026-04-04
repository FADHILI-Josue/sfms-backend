import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Length,
  Min,
  ArrayUnique,
} from 'class-validator';

import { FacilitySport, FacilityStatus, FacilityType } from '../facility.enums';

export class CreateFacilityDto {
  @ApiProperty()
  @IsString()
  @Length(2, 180)
  name!: string;

  @ApiProperty({ enum: FacilityType })
  @IsEnum(FacilityType)
  type!: FacilityType;

  @ApiPropertyOptional({ enum: FacilitySport, isArray: true })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsEnum(FacilitySport, { each: true })
  supportedSports?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  @Length(1, 80, { each: true })
  amenities?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(0, 80)
  dimensions?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  maxCapacity?: number;

  @ApiPropertyOptional({ enum: FacilityStatus })
  @IsOptional()
  @IsEnum(FacilityStatus)
  status?: FacilityStatus;

  @ApiPropertyOptional({ description: 'ISO date-time' })
  @IsOptional()
  @Type(() => Date)
  nextMaintenanceAt?: Date;

  @ApiPropertyOptional({ description: 'Money in cents' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  peakRateCents?: number;

  @ApiPropertyOptional({ description: 'Money in cents' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offPeakRateCents?: number;

  @ApiPropertyOptional({
    type: 'object',
    additionalProperties: true,
    description: 'Free-form facility metadata (address, amenities, etc).',
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
