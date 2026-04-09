import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, IsUUID, Length, Max, Min } from 'class-validator';

export class CreateRatingDto {
  @ApiProperty()
  @IsUUID()
  providerId!: string;

  @ApiProperty()
  @IsString()
  @Length(2, 180)
  beneficiaryName!: string;

  @ApiProperty({ minimum: 1, maximum: 5 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  comment?: string;
}
