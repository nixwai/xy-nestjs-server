import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import { AppModule } from '#/app.module.js';
import { createStrictValidationPipe } from '#/common/pipes/index.js';

/** 创建使用内存持久化实现的 HTTP 测试应用。 */
export async function createE2eApplication(): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  const app = moduleRef.createNestApplication();
  app.setGlobalPrefix('api');
  app.useGlobalPipes(createStrictValidationPipe());
  await app.init();
  return app;
}
