import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Length, Matches } from 'class-validator';

export class CreatePermissionDto {
  @ApiProperty({ example: 'users.read' })
  @IsString()
  @Length(3, 120)
  @Matches(/^[a-z0-9]+(\.[a-z0-9]+)*$/)
  key!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(0, 240)
  description?: string;
}

