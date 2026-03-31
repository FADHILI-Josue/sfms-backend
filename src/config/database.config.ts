import { registerAs } from '@nestjs/config';

export const databaseConfig = registerAs('database', () => ({
  enabled: process.env.DB_ENABLED ? process.env.DB_ENABLED === 'true' : process.env.NODE_ENV !== 'test',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  ssl: process.env.DB_SSL === 'true',
  logging: process.env.DB_LOGGING === 'true',
  synchronize: process.env.DB_SYNCHRONIZE === 'true',
}));
