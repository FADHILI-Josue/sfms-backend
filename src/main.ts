import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';

import { AppModule } from './app.module';
import { buildSwaggerDocument, swaggerSetupPath } from './swagger/swagger';
import { applyAppBootstrap } from './bootstrap/app-bootstrap';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));

  const config = app.get(ConfigService);
  const port = config.get<number>('app.port', 3000);

  applyAppBootstrap(app);

  const swaggerEnabled = config.get<boolean>('swagger.enabled', false);
  if (swaggerEnabled) {
    const document = buildSwaggerDocument(app);
    SwaggerModule.setup(swaggerSetupPath(config), app, document);
  }

  await app.listen(port);
}

void bootstrap();
