import type { UserEntity } from './entities/user.entity';
import { UserResponse } from './dto/user.response';

export function toUserResponse(user: UserEntity): UserResponse {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    status: user.status,
    lastLoginAt: user.lastLoginAt,
    roles: (user.roles ?? []).map((r) => ({ id: r.id, name: r.name })),
  };
}

