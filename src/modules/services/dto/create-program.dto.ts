import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Length, Min } from 'class-validator';

import { ProgramStatus } from '../service.enums';

export class CreateProgramDto {
  @ApiProperty()
  @IsString()
  @Length(2, 180)
  name!: string;

  @ApiProperty()
  @IsString()
  @Length(1, 80)
  category!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(15)
  durationMinutes?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  maxBeneficiaries?: number;

  @ApiPropertyOptional({ enum: ProgramStatus })
  @IsOptional()
  @IsEnum(ProgramStatus)
  status?: ProgramStatus;
}
