import { describe, expect, it } from 'vitest';
import { ResourceUrlService } from '#/common/services/resource-url.service.js';

function createService(config: { publicBaseUrl: string; bucket: string; region: string }) {
  return new ResourceUrlService({
    getOrThrow: () => ({ ...config })
  } as never);
}

describe('公共资源 URL', () => {
  it('使用当前环境域名根据 storageKey 动态生成访问地址', () => {
    const service = createService({
      publicBaseUrl: 'https://cdn.example.com/',
      bucket: 'asset-bucket',
      region: 'cn-hangzhou'
    });

    expect(service.toPublicUrl('/assets/1/image one.webp')).toBe('https://cdn.example.com/assets/1/image%20one.webp');
  });

  it('切换当前环境域名后，同一 storageKey 生成新域名地址', () => {
    const storageKey = 'assets/1/image.webp';
    const previousUrl = createService({
      publicBaseUrl: 'https://old-cdn.example.com',
      bucket: 'asset-bucket',
      region: 'cn-hangzhou'
    }).toPublicUrl(storageKey);
    const currentUrl = createService({
      publicBaseUrl: 'https://new-cdn.example.com',
      bucket: 'asset-bucket',
      region: 'cn-hangzhou'
    }).toPublicUrl(storageKey);

    expect(previousUrl).toBe('https://old-cdn.example.com/assets/1/image.webp');
    expect(currentUrl).toBe('https://new-cdn.example.com/assets/1/image.webp');
  });

  it('未配置自定义域名时使用 OSS 默认域名', () => {
    const service = createService({ publicBaseUrl: '', bucket: 'asset-bucket', region: 'cn-hangzhou' });

    expect(service.toPublicUrl('assets/1/image.webp')).toBe(
      'https://asset-bucket.cn-hangzhou.aliyuncs.com/assets/1/image.webp'
    );
  });

  it('可将带 storageKey 的内部记录转换为不暴露 Key 的公开记录', () => {
    const service = createService({
      publicBaseUrl: 'https://cdn.example.com',
      bucket: 'asset-bucket',
      region: 'cn-hangzhou'
    });

    expect(
      service.toPublicResource({ id: '1', storageKey: 'assets/1/image.webp', originalName: 'image.webp' })
    ).toEqual({
      id: '1',
      url: 'https://cdn.example.com/assets/1/image.webp',
      originalName: 'image.webp'
    });
  });
});
