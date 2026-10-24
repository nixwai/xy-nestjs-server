import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import { AppModule } from './app.module.js';
import { createStrictValidationPipe } from './common/pipes/index.js';
import type {
  AppConfig,
  CorsConfig,
  SwaggerConfig,
} from './config/config.types.js';

/** 将 CORS 白名单转换为 Nest 可接受的来源配置。 */
export function resolveCorsOrigin(
  origins: readonly string[],
): false | string[] {
  return origins.length > 0 ? [...origins] : false;
}

/** 创建并配置 Nest 应用实例。 */
export async function createApplication(): Promise<NestExpressApplication> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);
  const appConfig = configService.getOrThrow<AppConfig>('app');
  const corsConfig = configService.getOrThrow<CorsConfig>('cors');
  const swaggerConfig = configService.getOrThrow<SwaggerConfig>('swagger');

  app.setGlobalPrefix(appConfig.globalPrefix);
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'same-site' } }));
  app.enableCors({
    origin: resolveCorsOrigin(corsConfig.origins),
    credentials: true,
  });
  app.useGlobalPipes(createStrictValidationPipe());

  if (swaggerConfig.enabled) {
    const documentConfig = new DocumentBuilder()
      .setTitle('Scenic Guide Booking API')
      .setDescription('景区导游预约平台 REST API')
      .setVersion('1.0.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, documentConfig);
    SwaggerModule.setup(
      `${appConfig.globalPrefix}/${swaggerConfig.path}`,
      app,
      document,
    );
  }

  Logger.log(
    `Application configured for ${appConfig.environment}`,
    'Bootstrap',
  );
  return app;
}

/** 启动 HTTP 服务。 */
export async function bootstrap(): Promise<void> {
  const app = await createApplication();
  const appConfig = app.get(ConfigService).getOrThrow<AppConfig>('app');
  await app.listen(appConfig.port);
  Logger.log(`Application is running on port ${appConfig.port}`, 'Bootstrap');
}
