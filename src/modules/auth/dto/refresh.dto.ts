import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class RefreshDto {
  @ApiPropertyOptional({ description: 'If omitted, refresh token is read from cookie.' })
  @IsOptional()
  @IsString()
  @MinLength(10)
  refreshToken?: string;
}
