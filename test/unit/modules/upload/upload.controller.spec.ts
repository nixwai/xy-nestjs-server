import { RequestBoundedMemoryStorage } from '#/modules/upload/storage/bounded-memory.storage.js';
import type { INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { UploadModule } from '../../../../src/modules/upload/upload.module.js';
import { UploadService } from '../../../../src/modules/upload/upload.service.js';

describe('UploadController multipart config', () => {
  let app: INestApplication;
  const uploadService = {
    uploadImage: vi.fn().mockResolvedValue({}),
    batchUploadImages: vi.fn().mockResolvedValue({})
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          ignoreEnvFile: true,
          isGlobal: true,
          load: [() => ({ image: { maxFileSize: 8, maxFiles: 2 } })]
        }),
        UploadModule
      ]
    })
      .overrideProvider(UploadService)
      .useValue(uploadService)
      .compile();
    expect(module.get<{ storage: unknown }>('MULTER_MODULE_OPTIONS').storage).toBeInstanceOf(
      RequestBoundedMemoryStorage
    );
    app = module.createNestApplication();
    await app.init();
  });
  afterEach(async () => {
    await app.close();
    vi.clearAllMocks();
  });

  it('rejects missing single files', async () => {
    await request(app.getHttpServer()).post('/upload/image').expect(400);
    expect(uploadService.uploadImage).not.toHaveBeenCalled();
  });

  it('accepts a single file within the configured limit', async () => {
    await request(app.getHttpServer()).post('/upload/image').attach('file', Buffer.alloc(1), 'a.png').expect(201);
    expect(uploadService.uploadImage).toHaveBeenCalledWith(expect.objectContaining({ size: 1 }), undefined);
  });

  it('rejects oversized single files before calling the service', async () => {
    await request(app.getHttpServer()).post('/upload/image').attach('file', Buffer.alloc(9), 'a.png').expect(413);
    expect(uploadService.uploadImage).not.toHaveBeenCalled();
  });

  it('rejects oversized batch files before calling the service', async () => {
    await request(app.getHttpServer())
      .post('/upload/batch-images')
      .attach('files', Buffer.alloc(9), 'a.png')
      .expect(413);
    expect(uploadService.batchUploadImages).not.toHaveBeenCalled();
  });

  it('rejects excess batch count before calling the service', async () => {
    await request(app.getHttpServer())
      .post('/upload/batch-images')
      .attach('files', Buffer.alloc(1), 'a.png')
      .attach('files', Buffer.alloc(1), 'b.png')
      .attach('files', Buffer.alloc(1), 'c.png')
      .expect(400);
    expect(uploadService.batchUploadImages).not.toHaveBeenCalled();
  });

  it('accepts a batch at the configured file count', async () => {
    await request(app.getHttpServer())
      .post('/upload/batch-images')
      .attach('files', Buffer.alloc(1), 'a.png')
      .attach('files', Buffer.alloc(1), 'b.png')
      .expect(201);
    expect(uploadService.batchUploadImages).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ size: 1 })]),
      undefined
    );
  });
});

describe('UploadController 请求聚合预算', () => {
  let app: INestApplication;
  const uploadService = {
    uploadImage: vi.fn().mockResolvedValue({}),
    batchUploadImages: vi.fn().mockResolvedValue({})
  };
  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          ignoreEnvFile: true,
          isGlobal: true,
          load: [() => ({ image: { maxFileSize: 8, maxFiles: 2 } })]
        }),
        UploadModule
      ]
    })
      .overrideProvider(UploadService)
      .useValue(uploadService)
      .overrideProvider('MULTER_MODULE_OPTIONS')
      .useValue({ storage: new RequestBoundedMemoryStorage(4), limits: { fileSize: 8, files: 2 } })
      .compile();
    app = module.createNestApplication();
    await app.init();
  });
  afterEach(async () => {
    await app.close();
    vi.clearAllMocks();
  });
  it('每文件均合法但总量超限时拒绝且不进入service', async () => {
    await request(app.getHttpServer())
      .post('/upload/batch-images')
      .attach('files', Buffer.alloc(3), 'a.png')
      .attach('files', Buffer.alloc(2), 'b.png')
      .expect(400);
    expect(uploadService.batchUploadImages).not.toHaveBeenCalled();
  });
  it('总量恰好等于预算可接受，后续请求有独立预算', async () => {
    for (let index = 0; index < 2; index++) {
      await request(app.getHttpServer())
        .post('/upload/batch-images')
        .attach('files', Buffer.alloc(2), 'a.png')
        .attach('files', Buffer.alloc(2), 'b.png')
        .expect(201);
    }
    expect(uploadService.batchUploadImages).toHaveBeenCalledTimes(2);
  });
});
