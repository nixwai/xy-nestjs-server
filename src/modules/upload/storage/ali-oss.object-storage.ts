import { Inject, Injectable } from '@nestjs/common';
import OSS from 'ali-oss';
import { ConfigService } from '@nestjs/config';
import type { OssConfig } from '#/config/config.types.js';
import { ResourceUrlService } from '#/common/services/resource-url.service.js';
import { CONFIG_KEYS } from '#/config/config.constants.js';
import type { ObjectStorage, StoredObject } from '../types/upload-result.type.js';

/** 使用阿里云 OSS 保存和删除对象。 */
@Injectable()
export class AliOssObjectStorage implements ObjectStorage {
  private client: OSS | null = null;

  constructor(
    @Inject(ConfigService) private readonly config: ConfigService,
    @Inject(ResourceUrlService) private readonly urls: ResourceUrlService
  ) {}

  async put(key: string, content: Buffer, mimeType: string): Promise<StoredObject> {
    const result = await this.getClient().put(key, content, { headers: { 'Content-Type': mimeType } });
    const storageKey = result.name ?? key;
    return { storageKey, url: this.urls.toPublicUrl(storageKey) };
  }

  async delete(key: string): Promise<void> {
    await this.getClient().delete(key);
  }

  private getClient(): OSS {
    if (this.client) return this.client;
    const oss = this.config.get<OssConfig>(CONFIG_KEYS.oss);
    if (!oss?.region || !oss.bucket || !oss.accessKeyId || !oss.accessKeySecret) {
      throw new Error('图片存储服务未配置');
    }
    this.client = new OSS({
      region: oss.region,
      bucket: oss.bucket,
      accessKeyId: oss.accessKeyId,
      accessKeySecret: oss.accessKeySecret
    });
    return this.client;
  }
}
