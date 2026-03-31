import { SetMetadata } from '@nestjs/common';

import { REQUIRED_PERMISSIONS_KEY } from '../constants/auth.constants';

export const Permissions = (...permissions: string[]) =>
  SetMetadata(REQUIRED_PERMISSIONS_KEY, permissions);

