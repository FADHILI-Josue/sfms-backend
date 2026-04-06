import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, Length, MinLength } from 'class-validator';

export class RegisterFacilityDto {
  // Facility Info
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  facilityName!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  facilityType!: string; // Corresponds to FacilityType or Label

  @ApiProperty()
  @IsString({ each: true })
  @IsNotEmpty()
  sportTypes!: string[];

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  location!: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  city?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  zipCode?: string;

  @ApiProperty()
  @IsString({ each: true })
  @IsOptional()
  amenities?: string[];

  // Owner Info
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  firstName!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  lastName!: string;

  @ApiProperty()
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  phone!: string;

  @ApiProperty()
  @IsString()
  @MinLength(8)
  password!: string;
}
