import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import { AppModule } from '#/app.module.js';
import { createStrictValidationPipe } from '#/common/pipes/index.js';
import { ResourceUrlService } from '#/common/services/resource-url.service.js';
import { OBJECT_STORAGE } from '#/modules/upload/types/upload-result.type.js';

/** 创建使用内存持久化实现的 HTTP 测试应用。 */
export async function createE2eApplication(): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(OBJECT_STORAGE)
    .useValue({
      put: async (key: string, _content: Buffer, _mimeType: string) => ({
        storageKey: key
      }),
      delete: async (_key: string) => undefined
    })
    .overrideProvider(ResourceUrlService)
    .useValue({
      toPublicResource: <T extends { storageKey: string }>(resource: T) => {
        const { storageKey, ...publicResource } = resource;
        return { ...publicResource, url: `https://test.local/${storageKey}` };
      },
      toPublicResources: <T extends { storageKey: string }>(resources: readonly T[]) =>
        resources.map(resource => {
          const { storageKey, ...publicResource } = resource;
          return { ...publicResource, url: `https://test.local/${storageKey}` };
        })
    })
    .compile();
  const app = moduleRef.createNestApplication();
  app.setGlobalPrefix('api');
  app.useGlobalPipes(createStrictValidationPipe());
  await app.init();
  return app;
}
