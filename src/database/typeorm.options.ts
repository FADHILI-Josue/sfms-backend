import type { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

export function createTypeOrmOptions(config: ConfigService): TypeOrmModuleOptions {
  const isTest = process.env.NODE_ENV === 'test' || !!process.env.JEST_WORKER_ID;
  if (isTest) {
    return {
      type: 'sqljs',
      autoLoadEntities: true,
      synchronize: true,
      logging: false,
      location: ':memory:',
      autoSave: false,
    } as any;
  }

  return {
    type: 'postgres',
    host: config.get<string>('database.host'),
    port: config.get<number>('database.port'),
    username: config.get<string>('database.username'),
    password: config.get<string>('database.password'),
    database: config.get<string>('database.database'),
    ssl: config.get<boolean>('database.ssl') ? { rejectUnauthorized: false } : false,
    logging: config.get<boolean>('database.logging'),
    autoLoadEntities: true,
    synchronize: config.get<boolean>('database.synchronize', false),
  };
}
