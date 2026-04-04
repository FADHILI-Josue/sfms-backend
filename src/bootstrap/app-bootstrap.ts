import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import compression from 'compression';
import helmet from 'helmet';

import { AllExceptionsFilter } from '../common/filters/all-exceptions.filter';
import { RequestIdInterceptor } from '../common/interceptors/request-id.interceptor';

export function applyAppBootstrap(app: INestApplication) {
  const config = app.get(ConfigService);
  const apiPrefix = config.get<string>('app.apiPrefix', '/api');
  const apiVersion = config.get<string>('app.apiVersion', '1');
  const corsOrigins = config.get<string[]>('app.corsOrigins', []);
  const isProd = (process.env.NODE_ENV ?? 'development') === 'production';

  const devDefaults = [
    'http://localhost:5173',
    'http://localhost:8080',
    'http://localhost:3000',
  ];
  const allowedOrigins = new Set<string>([
    ...corsOrigins,
    ...(!isProd ? devDefaults : []),
  ]);

  app.enableVersioning({ type: VersioningType.URI, defaultVersion: apiVersion });
  app.setGlobalPrefix(apiPrefix.replace(/\/$/, ''));

  app.enableCors({
    origin: (origin, callback) => {
      // Allow non-browser clients (no Origin header)
      if (!origin) return callback(null, true);
      if (corsOrigins.length === 0 && !isProd) return callback(null, true);
      if (allowedOrigins.has(origin)) return callback(null, true);
      return callback(new Error('CORS origin not allowed.'), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.use(helmet());
  app.use(compression());

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      forbidUnknownValues: true,
    }),
  );

  app.useGlobalFilters(new AllExceptionsFilter(config));
  app.useGlobalInterceptors(new RequestIdInterceptor());
}
