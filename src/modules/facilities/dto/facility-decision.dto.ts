import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Length } from 'class-validator';

export class FacilityDecisionDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(0, 240)
  reason?: string;
}

