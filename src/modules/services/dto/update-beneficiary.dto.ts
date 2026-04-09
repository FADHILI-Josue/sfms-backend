import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Length, Min } from 'class-validator';

import { BeneficiaryStatus } from '../service.enums';

export class UpdateBeneficiaryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(2, 180)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(0, 60)
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(0, 180)
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  totalSessions?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sessionsCompleted?: number;

  @ApiPropertyOptional({ enum: BeneficiaryStatus })
  @IsOptional()
  @IsEnum(BeneficiaryStatus)
  status?: BeneficiaryStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
