import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsInt, IsObject, IsOptional, IsString, Length, Min } from 'class-validator';

export class CreateCourtDto {
  @ApiProperty()
  @IsString()
  @Length(2, 180)
  name!: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  supportedSports?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

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

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  mainImage?: string;

  @ApiPropertyOptional({ type: 'object', additionalProperties: true })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

