import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { INestApplication, Logger } from '@nestjs/common';
import helmet from 'helmet';
import { AppModule } from './app.module.js';
import { createStrictValidationPipe } from './common/pipes/index.js';
import type {
  AppConfig,
  CorsConfig,
  SwaggerConfig,
} from './config/config.types.js';

/**
 * 将 CORS 白名单转换为 Nest 可接受的来源配置。
 *
 * @param origins - CORS 允许的来源列表。
 * @returns 有来源时返回副本，没有来源时禁用 CORS。
 */
export function resolveCorsOrigin(
  origins: readonly string[],
): false | string[] {
  if (origins.length === 0) {
    return false;
  }

  return [...origins];
}

/**
 * 创建并配置 Nest 应用实例。
 *
 * @returns 已完成全局配置但尚未开始监听端口的应用实例。
 */
export async function createApplication(): Promise<INestApplication> {
  const app = await NestFactory.create<INestApplication>(AppModule);
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

/**
 * 启动 HTTP 服务。
 *
 * @returns HTTP 服务启动完成后的 Promise。
 */
export async function bootstrap(): Promise<void> {
  const app = await createApplication();
  const configService = app.get(ConfigService);
  const appConfig = configService.getOrThrow<AppConfig>('app');
  await app.listen(appConfig.port, '0.0.0.0');
  Logger.log(`Application is running on port ${appConfig.port}`, 'Bootstrap');
}
