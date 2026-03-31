import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { REQUIRED_PERMISSIONS_KEY } from '../constants/auth.constants';
import type { AuthUser } from '../../modules/auth/types/auth-user.type';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[]>(
      REQUIRED_PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!required || required.length === 0) return true;

    const req = context.switchToHttp().getRequest<{ user?: AuthUser }>();
    const user = req.user;
    if (!user) throw new ForbiddenException('Missing authenticated user.');

    const userPermissions = new Set(user.permissions ?? []);
    const hasAll = required.every((p) => userPermissions.has(p));
    if (!hasAll) throw new ForbiddenException('Insufficient permissions.');

    return true;
  }
}

