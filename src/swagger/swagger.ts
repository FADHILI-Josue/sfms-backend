import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export function swaggerSetupPath(config: ConfigService): string {
  const path = config.get<string>('swagger.path', '/docs');
  return path.startsWith('/') ? path : `/${path}`;
}

export function buildSwaggerDocument(app: INestApplication) {
  const config = app.get(ConfigService);
  const title = config.get<string>('app.name', 'SFMS API');
  const apiVersion = config.get<string>('app.apiVersion', '1');

  const builder = new DocumentBuilder()
    .setTitle(title)
    .setDescription('Sports Facility Management System API')
    .setVersion(`v${apiVersion}`)
    .addBearerAuth();

  return SwaggerModule.createDocument(app, builder.build());
}
