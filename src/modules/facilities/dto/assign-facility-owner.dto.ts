import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class AssignFacilityOwnerDto {
  @ApiProperty()
  @IsUUID()
  ownerId!: string;
}
