import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Min,
} from 'class-validator';

export class SubmitFacilityApplicationDto {
  @ApiProperty()
  @IsString()
  @Length(2, 180)
  ownerName!: string;

  @ApiProperty()
  @IsEmail()
  ownerEmail!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(0, 40)
  ownerPhone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(0, 180)
  organization?: string;

  @ApiProperty()
  @IsString()
  @Length(2, 180)
  facilityName!: string;

  @ApiProperty()
  @IsString()
  @Length(2, 120)
  facilityTypeLabel!: string;

  @ApiProperty({ type: [String] })
  @IsArray()
  requestedSports!: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(0, 240)
  location?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  capacity?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(0, 80)
  dimensions?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(0, 240)
  amenities?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(0, 800)
  description?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  imageUrls?: string[];
}

