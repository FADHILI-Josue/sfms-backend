import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Min,
} from 'class-validator';

import { FacilityStatus, FacilityType } from '../facility.enums';

export class CreateFacilityDto {
  @ApiProperty()
  @IsString()
  @Length(2, 180)
  name!: string;

  @ApiProperty({ enum: FacilityType })
  @IsEnum(FacilityType)
  type!: FacilityType;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  supportedSports?: string[];

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
}

