import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEmail,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  MinLength,
} from 'class-validator';

export class UpsertFacilityStaffDto {
  @ApiPropertyOptional({ description: 'Assign an existing user.' })
  @IsOptional()
  @IsUUID('4')
  userId?: string;

  @ApiPropertyOptional({ description: 'Create a new user if userId is not provided.' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(2, 180)
  fullName?: string;

  @ApiPropertyOptional({ description: 'Required when creating a new user.' })
  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;

  @ApiProperty({
    description: 'Role name for this facility assignment (e.g. FACILITY_ADMIN, FINANCE_OFFICER).',
  })
  @IsString()
  @Length(2, 80)
  roleName!: string;

  @ApiPropertyOptional({
    type: [String],
    description: 'Optional restriction to specific courts. Empty/omitted => access to all courts in the facility.',
  })
  @IsOptional()
  @IsArray()
  @Type(() => String)
  courtIds?: string[];

  @ApiPropertyOptional({ description: 'Overwrite user roles with these role IDs (optional).' })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  roleIds?: string[];
}

