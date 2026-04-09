import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsUUID, Matches } from 'class-validator';

import { AttendanceStatus } from '../service.enums';

export class UpsertAttendanceDto {
  @ApiProperty()
  @IsUUID()
  sessionId!: string;

  @ApiProperty()
  @IsUUID()
  beneficiaryId!: string;

  @ApiProperty({ enum: AttendanceStatus })
  @IsEnum(AttendanceStatus)
  status!: AttendanceStatus;

  @ApiPropertyOptional({ description: 'HH:MM (24h)' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: 'checkIn must be HH:MM' })
  checkIn?: string | null;

  @ApiPropertyOptional({ description: 'HH:MM (24h)' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: 'checkOut must be HH:MM' })
  checkOut?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
