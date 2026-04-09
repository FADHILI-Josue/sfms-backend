import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, IsUUID, Length, Min, Matches } from 'class-validator';

import { SessionType, SessionStatus } from '../service.enums';

export class CreateSessionDto {
  @ApiProperty()
  @IsUUID()
  programId!: string;

  @ApiProperty({ description: 'YYYY-MM-DD' })
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'scheduledDate must be YYYY-MM-DD' })
  scheduledDate!: string;

  @ApiProperty({ description: 'HH:MM (24h)' })
  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: 'startTime must be HH:MM' })
  startTime!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(15)
  durationMinutes?: number;

  @ApiPropertyOptional({ enum: SessionType })
  @IsOptional()
  @IsEnum(SessionType)
  type?: SessionType;

  @ApiPropertyOptional({ enum: SessionStatus })
  @IsOptional()
  @IsEnum(SessionStatus)
  status?: SessionStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(0, 180)
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  beneficiaryId?: string | null;
}
