import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CONFIG_KEYS } from '#/config/config.constants.js';
import type { OssConfig } from '#/config/config.types.js';

/** 将资源存储 Key 转换为当前环境的公开访问地址。 */
@Injectable()
export class ResourceUrlService {
  /** 创建当前实例。 */
  constructor(@Inject(ConfigService) private readonly configService: ConfigService) {}

  /** 根据配置生成公开资源 URL。 */
  toPublicUrl(storageKey: string): string {
    const config = this.configService.getOrThrow<OssConfig>(CONFIG_KEYS.oss);
    const baseUrl = config.publicBaseUrl || `https://${config.bucket}.${config.region}.aliyuncs.com`;
    const normalizedBaseUrl = baseUrl.replace(/\/+$/, '');
    const normalizedKey = storageKey.replace(/^\/+/, '');
    return `${normalizedBaseUrl}/${normalizedKey}`;
  }
}
