import { InternalServerErrorException, Logger } from '@nestjs/common';
import { afterEach, describe, expect, it, vi } from 'vitest';
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
    get: vi.fn((key: string) => (key === 'oss' ? oss : undefined))
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
    const service = new UploadService(
      createConfigService() as never,
      { toPublicUrl: (key: string) => `https://cdn.example.com/${key}` } as never
    );
    const file = createFile(Buffer.from('not an image'), { mimetype: 'text/plain' });

    await expect(service.uploadImage(file)).rejects.toMatchObject({
      response: { message: '仅支持 JPEG、PNG、WebP、GIF 格式的图片' }
    });
  });

  it('returns a public OSS URL after processing and uploading an image', async () => {
    const service = new UploadService(
      createConfigService() as never,
      { toPublicUrl: (key: string) => `https://cdn.example.com/${key}` } as never
    );
    const buffer = await sharp({ create: { width: 1, height: 1, channels: 3, background: 'red' } })
      .png()
      .toBuffer();
    const put = vi.fn().mockResolvedValue({});
    (service as unknown as { client: { put: typeof put } }).client = { put };

    const result = await service.uploadImage(createFile(buffer), 'article');

    expect(result).toMatchObject({
      category: 'article',
      storageKey: expect.stringMatching(/^images\/article\/.+\.png$/),
      url: expect.stringMatching(/^https:\/\/cdn\.example\.com\/images\/article\//)
    });
    expect(put).toHaveBeenCalledWith(expect.stringMatching(/^images\/article\/.+\.png$/), expect.any(Buffer), {
      headers: { 'Content-Type': 'image/png' }
    });
  });

  it('rejects a category containing path separators', async () => {
    const service = new UploadService(
      createConfigService() as never,
      { toPublicUrl: (key: string) => `https://cdn.example.com/${key}` } as never
    );
    const file = createFile(Buffer.from('not an image'));

    await expect(service.uploadImage(file, '../private')).rejects.toMatchObject({
      response: { message: '图片分类格式无效' }
    });
  });

  it('rejects a batch larger than the configured limit', async () => {
    const service = new UploadService(
      createConfigService() as never,
      { toPublicUrl: (key: string) => `https://cdn.example.com/${key}` } as never
    );
    const file = createFile(Buffer.from('not an image'));

    await expect(service.batchUploadImages([file, file, file])).rejects.toMatchObject({
      response: { message: '最多支持上传 2 张图片' }
    });
  });

  it('returns a service-unavailable error when OSS is not configured', async () => {
    const service = new UploadService(
      createConfigService(null) as never,
      { toPublicUrl: (key: string) => key } as never
    );
    const buffer = await sharp({ create: { width: 1, height: 1, channels: 3, background: 'red' } })
      .png()
      .toBuffer();

    await expect(service.uploadImage(createFile(buffer))).rejects.toMatchObject({
      response: { message: '图片存储服务未配置' }
    });
  });
});

describe('processed image contract', () => {
  afterEach(() => vi.restoreAllMocks());
  function setup(toPublicUrl = (key: string) => `https://cdn.example.com/${key}`) {
    const service = new UploadService(createConfigService() as never, { toPublicUrl } as never);
    const client = { put: vi.fn().mockResolvedValue({}), delete: vi.fn().mockResolvedValue({}) };
    (service as unknown as { client: typeof client }).client = client;
    return { service, client };
  }

  it('returns the stored JPEG metadata for a resized GIF without changing the input', async () => {
    const { service, client } = setup();
    const buffer = await sharp({ create: { width: 200, height: 100, channels: 3, background: 'red' } })
      .gif()
      .toBuffer();
    const file = Object.freeze(createFile(buffer, { mimetype: 'image/gif', originalname: 'animation.gif' }));
    const result = await service.uploadImage(file, 'asset');
    const stored = client.put.mock.calls[0][1] as Buffer;
    const metadata = await sharp(stored).metadata();
    expect(result).toMatchObject({
      mimeType: 'image/jpeg',
      size: stored.length,
      width: 100,
      height: 50,
      category: 'asset',
      storageKey: expect.stringMatching(/\.jpg$/)
    });
    expect(metadata).toMatchObject({ format: 'jpeg', width: 100, height: 50 });
    expect(client.put.mock.calls[0][2]).toEqual({ headers: { 'Content-Type': 'image/jpeg' } });
    expect(file.buffer).toBe(buffer);
    expect(file.mimetype).toBe('image/gif');
  });

  it('validates the entire batch synchronously against config before OSS', () => {
    const { service, client } = setup();
    const file = createFile(Buffer.from('x'));
    expect(() => service.validateBatch([])).toThrow('请选择要上传的图片');
    expect(() => service.validateBatch([file, file, file])).toThrow('最多支持上传 2 张图片');
    expect(() => service.validateBatch([file, { ...file, mimetype: 'text/plain' }])).toThrow('仅支持');
    expect(() => service.validateBatch([{ ...file, size: imageConfig.maxFileSize + 1 }])).toThrow('图片大小不能超过');
    expect(() => service.validateBatch([{ ...file, buffer: Buffer.alloc(imageConfig.maxFileSize + 1) }])).toThrow(
      '图片大小不能超过'
    );
    expect(() => service.validateBatch([{ ...file, buffer: Buffer.alloc(0) }])).toThrow('图片文件不能为空');
    expect(() => service.validateBatch([file, file])).not.toThrow();
    expect(client.put).not.toHaveBeenCalled();
  });

  it('finishes all local processing before sending any object to OSS', async () => {
    const { service, client } = setup();
    const buffer = await sharp({ create: { width: 1, height: 1, channels: 3, background: 'red' } })
      .png()
      .toBuffer();
    await expect(service.batchUploadImages([createFile(buffer), createFile(Buffer.from('invalid'))])).rejects.toThrow(
      '图片处理失败'
    );
    expect(client.put).not.toHaveBeenCalled();
  });

  it('compensates when public URL creation fails after upload', async () => {
    const errorLog = vi.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    const warnLog = vi.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    const { service, client } = setup(() => {
      throw new Error('invalid public URL config');
    });
    const buffer = await sharp({ create: { width: 1, height: 1, channels: 3, background: 'red' } })
      .png()
      .toBuffer();
    await expect(service.uploadImage(createFile(buffer))).rejects.toThrow('图片上传失败');
    expect(client.delete).toHaveBeenCalledWith(client.put.mock.calls[0][0]);
    expect(errorLog).toHaveBeenCalledWith(expect.stringContaining('图片上传失败'), expect.any(String));
    expect(warnLog).toHaveBeenCalledWith(expect.stringContaining('已补偿删除'));
  });

  it('returns processed metadata through the existing upload method', async () => {
    const { service } = setup();
    const buffer = await sharp({ create: { width: 200, height: 100, channels: 3, background: 'red' } })
      .webp()
      .toBuffer();
    expect(await service.uploadImage(createFile(buffer, { mimetype: 'image/webp' }))).toMatchObject({
      mimeType: 'image/webp',
      size: expect.any(Number),
      width: 100,
      height: 50
    });
  });
});

describe('OSS failure isolation', () => {
  afterEach(() => vi.restoreAllMocks());

  async function setup() {
    const errorLog = vi.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    const client = { put: vi.fn().mockResolvedValue({}), delete: vi.fn().mockResolvedValue({}) };
    const service = new UploadService(
      createConfigService() as never,
      { toPublicUrl: (key: string) => `https://cdn.example.com/${key}` } as never
    );
    (service as unknown as { client: typeof client }).client = client;
    const buffer = await sharp({ create: { width: 1, height: 1, channels: 3, background: 'red' } })
      .png()
      .toBuffer();
    return { service, client, errorLog, file: createFile(buffer) };
  }

  it('reports remote partial failure without removing successful objects', async () => {
    const { service, client, file } = await setup();
    client.put.mockRejectedValueOnce(new Error('OSS unavailable'));
    const result = await service.batchUploadImages([file, { ...file, originalname: 'second.png' }]);
    expect(result).toMatchObject({
      totalCount: 2,
      successCount: 1,
      success: [expect.objectContaining({ mimeType: 'image/png', width: 1, height: 1 })],
      failed: [{ filename: 'photo.png', reason: '图片上传失败，请稍后重试' }]
    });
    expect(client.delete).not.toHaveBeenCalled();
  });

  it.each([
    new Error('OSS endpoint https://private.example.com accessKey=secret'),
    new InternalServerErrorException('OSS endpoint https://private.example.com accessKey=secret')
  ])('uses a constant public batch reason for dependency failures: %s', async error => {
    const { service, client, file } = await setup();
    client.put.mockRejectedValueOnce(error);
    const result = await service.batchUploadImages([file, { ...file, originalname: 'second.png' }]);
    expect(result.failed).toEqual([{ filename: 'photo.png', reason: '图片上传失败，请稍后重试' }]);
    expect(JSON.stringify(result)).not.toContain('accessKey');
    expect(JSON.stringify(result)).not.toContain('private.example.com');
  });
  it('reports total remote failure without falling back to local storage', async () => {
    const { service, client, file } = await setup();
    client.put.mockRejectedValue(new Error('OSS unavailable'));
    await expect(service.batchUploadImages([file, file])).rejects.toThrow('所有图片上传失败');
    expect(client.put).toHaveBeenCalledTimes(2);
    expect(client.delete).not.toHaveBeenCalled();
  });

  it('logs the object key when compensation fails and preserves the safe error', async () => {
    const { client, errorLog, file } = await setup();
    const toPublicUrl = vi.fn(() => {
      throw new Error('public URL config error');
    });
    const failingService = new UploadService(createConfigService() as never, { toPublicUrl } as never);
    (failingService as unknown as { client: typeof client }).client = client;
    client.delete.mockRejectedValue(new Error('delete failed'));
    await expect(failingService.uploadImage(file)).rejects.toThrow('图片上传失败，请稍后重试');
    expect(errorLog).toHaveBeenCalledWith(
      expect.stringContaining(`OSS 对象补偿删除失败，需人工处理: ${client.put.mock.calls[0][0]}`),
      expect.any(String)
    );
  });

  it('rejects unsupported decoded content before any upload even with a valid declared mime', async () => {
    const { service, client } = await setup();
    const buffer = await sharp({ create: { width: 1, height: 1, channels: 3, background: 'red' } })
      .tiff()
      .toBuffer();
    await expect(service.uploadImage(createFile(buffer))).rejects.toThrow('图片处理失败');
    expect(client.put).not.toHaveBeenCalled();
  });

  it('preserves batch metadata for all successful uploads', async () => {
    const { service, file } = await setup();
    expect(await service.batchUploadImages([file, file])).toMatchObject({
      successCount: 2,
      totalCount: 2,
      failed: [],
      success: [expect.objectContaining({ mimeType: 'image/png' }), expect.objectContaining({ mimeType: 'image/png' })]
    });
  });
});

describe('通用批量上传资源边界', () => {
  afterEach(() => vi.restoreAllMocks());
  function setup() {
    const config = { ...imageConfig, maxFiles: 50, maxFileSize: 50 * 1024 * 1024 };
    const service = new UploadService(
      { getOrThrow: () => config } as never,
      { toPublicUrl: (key: string) => `https://example.test/${key}` } as never
    );
    const client = { put: vi.fn().mockResolvedValue({}), delete: vi.fn().mockResolvedValue({}) };
    (service as unknown as { client: typeof client }).client = client;
    const processed = {
      buffer: Buffer.alloc(1),
      extension: 'png',
      mimeType: 'image/png',
      size: 1,
      width: 1,
      height: 1
    };
    const target = service as unknown as {
      processImage: (buffer: Buffer, config: ImageConfig) => Promise<typeof processed>;
    };
    return { service, client, processed, target };
  }
  it('校验实际buffer总量，不能通过伪造size绕过64MiB预算', async () => {
    const { service, client, target, processed } = setup();
    const process = vi.spyOn(target, 'processImage').mockResolvedValue(processed);
    const buffer = Buffer.alloc(33 * 1024 * 1024);
    await expect(
      service.batchUploadImages([createFile(buffer, { size: 1 }), createFile(buffer, { size: 1 })])
    ).rejects.toThrow('本次上传文件总大小不能超过');
    expect(process).not.toHaveBeenCalled();
    expect(client.put).not.toHaveBeenCalled();
  });
  it('图片处理同时最多3个，保持输入顺序', async () => {
    const { service, client, target, processed } = setup();
    let active = 0;
    let peak = 0;
    vi.spyOn(target, 'processImage').mockImplementation(async () => {
      active++;
      peak = Math.max(peak, active);
      await new Promise(resolve => setTimeout(resolve, 5));
      active--;
      return processed;
    });
    const result = await service.batchUploadImages(
      Array.from({ length: 7 }, (_, i) => createFile(Buffer.alloc(1), { originalname: `${i}.png` }))
    );
    expect(peak).toBe(3);
    expect(result.successCount).toBe(7);
    expect(client.put).toHaveBeenCalledTimes(7);
  });
  it('OSS上传同时最多3个，部分失败仍按输入顺序返回', async () => {
    const { service, client, target, processed } = setup();
    vi.spyOn(target, 'processImage').mockResolvedValue(processed);
    vi.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    let active = 0;
    let peak = 0;
    let index = 0;
    client.put.mockImplementation(async () => {
      const current = index++;
      active++;
      peak = Math.max(peak, active);
      await new Promise(resolve => setTimeout(resolve, 5));
      active--;
      if (current === 1 || current === 4) throw new Error('remote failure');
      return {};
    });
    const result = await service.batchUploadImages(
      Array.from({ length: 7 }, (_, i) => createFile(Buffer.alloc(1), { originalname: `${i}.png` }))
    );
    expect(peak).toBe(3);
    expect(result.successCount).toBe(5);
    expect(result.failed.map(x => x.filename)).toEqual(['1.png', '4.png']);
  });
  it('处理后总buffer同样受预算约束，超限前不写OSS', async () => {
    const { service, client, target, processed } = setup();
    vi.spyOn(target, 'processImage').mockResolvedValue({ ...processed, buffer: Buffer.alloc(33 * 1024 * 1024) });
    await expect(service.batchUploadImages([createFile(Buffer.alloc(1)), createFile(Buffer.alloc(1))])).rejects.toThrow(
      '处理后图片总大小不能超过'
    );
    expect(client.put).not.toHaveBeenCalled();
  });
  it('处理失败等待当前批次结束、不再启动后续批次且不上传', async () => {
    const { service, client, target, processed } = setup();
    let active = 0;
    const process = vi.spyOn(target, 'processImage').mockImplementation(async () => {
      active++;
      try {
        await new Promise(resolve => setTimeout(resolve, 5));
        return processed;
      } finally {
        active--;
      }
    });
    process.mockRejectedValueOnce(new Error('decode failed'));
    await expect(
      service.batchUploadImages(Array.from({ length: 7 }, () => createFile(Buffer.alloc(1))))
    ).rejects.toThrow('decode failed');
    expect(active).toBe(0);
    expect(process).toHaveBeenCalledTimes(3);
    expect(client.put).not.toHaveBeenCalled();
  });
});
