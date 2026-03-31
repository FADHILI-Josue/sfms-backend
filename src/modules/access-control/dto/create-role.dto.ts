import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString, Length, Matches } from 'class-validator';

export class CreateRoleDto {
  @ApiProperty({ example: 'SUPER_ADMIN' })
  @IsString()
  @Length(2, 80)
  @Matches(/^[A-Z0-9_]+$/)
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(0, 240)
  description?: string;

  @ApiPropertyOptional({ type: [String], description: 'Permission keys to attach.' })
  @IsOptional()
  @IsArray()
  permissionKeys?: string[];
}

