import { describe, expect, it, vi } from 'vitest';
import sharp from 'sharp';
import { UploadService } from '#/modules/upload/upload.service.js';
import type { ImageConfig, OssConfig } from '#/config/config.types.js';
import type { UploadImageFile } from '#/modules/upload/types/upload-image-file.type.js';

const imageConfig: ImageConfig = {
  quality: 80,
  maxWidth: 100,
  maxHeight: 100,
  maxFileSize: 1024 * 1024,
  maxFiles: 2
};

const ossConfig: OssConfig = {
  region: 'oss-cn-hangzhou',
  bucket: 'example-bucket',
  accessKeyId: 'access-key',
  accessKeySecret: 'access-secret',
  publicBaseUrl: 'https://cdn.example.com/'
};

function createConfigService(oss: OssConfig | null = ossConfig) {
  return {
    getOrThrow: vi.fn((key: string) => {
      if (key === 'image') return imageConfig;
      throw new Error(`unexpected key: ${key}`);
    }),
    get: vi.fn((key: string) => key === 'oss' ? oss : undefined)
  };
}

function createFile(buffer: Buffer, overrides: Partial<UploadImageFile> = {}): UploadImageFile {
  return {
    fieldname: 'file',
    originalname: 'photo.png',
    encoding: '7bit',
    mimetype: 'image/png',
    size: buffer.length,
    buffer,
    ...overrides
  };
}

describe('UploadService', () => {
  it('rejects unsupported file types before contacting OSS', async () => {
    const service = new UploadService(createConfigService() as never, { toPublicUrl: (key: string) => `https://cdn.example.com/${key}` } as never);
    const file = createFile(Buffer.from('not an image'), { mimetype: 'text/plain' });

    await expect(service.uploadImage(file)).rejects.toMatchObject({ response: { message: '仅支持 JPEG、PNG、WebP、GIF 格式的图片' } });
  });

  it('returns a public OSS URL after processing and uploading an image', async () => {
    const service = new UploadService(createConfigService() as never, { toPublicUrl: (key: string) => `https://cdn.example.com/${key}` } as never);
    const buffer = await sharp({ create: { width: 1, height: 1, channels: 3, background: 'red' } }).png().toBuffer();
    const put = vi.fn().mockResolvedValue({});
    (service as unknown as { client: { put: typeof put } }).client = { put };

    const result = await service.uploadImage(createFile(buffer), 'article');

    expect(result).toMatchObject({
      category: 'article',
      storageKey: expect.stringMatching(/^images\/article\/.+\.png$/),      url: expect.stringMatching(/^https:\/\/cdn\.example\.com\/images\/article\//)
    });
    expect(put).toHaveBeenCalledWith(
      expect.stringMatching(/^images\/article\/.+\.png$/),
      expect.any(Buffer),
      { headers: { 'Content-Type': 'image/png' } }
    );
  });

  it('rejects a category containing path separators', async () => {
    const service = new UploadService(createConfigService() as never, { toPublicUrl: (key: string) => `https://cdn.example.com/${key}` } as never);
    const file = createFile(Buffer.from('not an image'));

    await expect(service.uploadImage(file, '../private')).rejects.toMatchObject({ response: { message: '图片分类格式无效' } });
  });

  it('rejects a batch larger than the configured limit', async () => {
    const service = new UploadService(createConfigService() as never, { toPublicUrl: (key: string) => `https://cdn.example.com/${key}` } as never);
    const file = createFile(Buffer.from('not an image'));

    await expect(service.batchUploadImages([file, file, file])).rejects.toMatchObject({ response: { message: '最多支持上传 2 张图片' } });
  });

  it('returns a service-unavailable error when OSS is not configured', async () => {
    const service = new UploadService(createConfigService(null) as never, { toPublicUrl: (key: string) => key } as never);
    const buffer = await sharp({ create: { width: 1, height: 1, channels: 3, background: 'red' } }).png().toBuffer();

    await expect(service.uploadImage(createFile(buffer))).rejects.toMatchObject({ response: { message: '图片存储服务未配置' } });
  });
});

