import { ApiProperty } from '@nestjs/swagger';

import { UserStatus } from '../user-status.enum';

export class UserRoleResponse {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;
}

export class UserResponse {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty()
  fullName!: string;

  @ApiProperty({ enum: UserStatus })
  status!: UserStatus;

  @ApiProperty({ nullable: true })
  lastLoginAt!: Date | null;

  @ApiProperty({ type: [UserRoleResponse] })
  roles!: UserRoleResponse[];
}

