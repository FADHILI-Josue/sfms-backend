import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, IsUUID, Length, Max, Min } from 'class-validator';

import {
  FacilityApprovalStatus,
  FacilitySortField,
  FacilitySport,
  FacilityStatus,
  FacilityType,
} from '../facility.enums';

export enum SortDirection {
  ASC = 'ASC',
  DESC = 'DESC',
}

export enum FacilityOwnerState {
  ASSIGNED = 'assigned',
  UNASSIGNED = 'unassigned',
}

export class ListFacilitiesQueryDto {
  @ApiPropertyOptional({ minimum: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 12 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number = 12;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(1, 120)
  search?: string;

  @ApiPropertyOptional({ enum: FacilityStatus })
  @IsOptional()
  @IsEnum(FacilityStatus)
  status?: FacilityStatus;

  @ApiPropertyOptional({ enum: FacilityType })
  @IsOptional()
  @IsEnum(FacilityType)
  type?: FacilityType;

  @ApiPropertyOptional({ enum: FacilityApprovalStatus })
  @IsOptional()
  @IsEnum(FacilityApprovalStatus)
  approvalStatus?: FacilityApprovalStatus;

  @ApiPropertyOptional({ enum: FacilitySport })
  @IsOptional()
  @IsEnum(FacilitySport)
  sport?: FacilitySport;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  ownerId?: string;

  @ApiPropertyOptional({ enum: FacilityOwnerState })
  @IsOptional()
  @IsEnum(FacilityOwnerState)
  ownerState?: FacilityOwnerState;

  @ApiPropertyOptional({ enum: FacilitySortField, default: FacilitySortField.CREATED_AT })
  @IsOptional()
  @IsEnum(FacilitySortField)
  sortBy?: FacilitySortField = FacilitySortField.CREATED_AT;

  @ApiPropertyOptional({ enum: SortDirection, default: SortDirection.DESC })
  @IsOptional()
  @IsEnum(SortDirection)
  sortDirection?: SortDirection = SortDirection.DESC;
}
