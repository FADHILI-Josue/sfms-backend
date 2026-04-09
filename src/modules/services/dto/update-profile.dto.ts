import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsObject, IsOptional, IsString, IsUUID, Length } from 'class-validator';

export class UpdateProfileDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(0, 180)
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(0, 60)
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(0, 120)
  location?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skills?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  certifications?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  availability?: Record<string, string>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  facilityId?: string | null;
}
