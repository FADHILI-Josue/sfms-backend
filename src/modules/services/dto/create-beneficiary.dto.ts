import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, IsUUID, Length, Min } from 'class-validator';

import { BeneficiaryStatus } from '../service.enums';

export class CreateBeneficiaryDto {
  @ApiProperty()
  @IsUUID()
  programId!: string;

  @ApiProperty()
  @IsString()
  @Length(2, 180)
  name!: string;

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
  @Min(1)
  totalSessions?: number;

  @ApiPropertyOptional({ enum: BeneficiaryStatus })
  @IsOptional()
  @IsEnum(BeneficiaryStatus)
  status?: BeneficiaryStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
