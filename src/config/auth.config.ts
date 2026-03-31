import { registerAs } from '@nestjs/config';

export const authConfig = registerAs('auth', () => ({
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET!,
  jwtAccessTtlSeconds: Number(process.env.JWT_ACCESS_TTL_SECONDS ?? 900),
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET!,
  jwtRefreshTtlSeconds: Number(process.env.JWT_REFRESH_TTL_SECONDS ?? 60 * 60 * 24 * 7),
}));

