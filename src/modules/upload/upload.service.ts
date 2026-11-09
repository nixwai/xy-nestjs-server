import {
  BadRequestException,
  HttpException,
  InternalServerErrorException,
  Injectable,
  Inject,
  ServiceUnavailableException
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OSS from 'ali-oss';
import { randomUUID } from 'node:crypto';
import sharp from 'sharp';
import { CONFIG_KEYS } from '#/config/config.constants.js';
import { ResourceUrlService } from '#/common/services/resource-url.service.js';
import type { ImageConfig, OssConfig } from '#/config/config.types.js';
import type { BatchUploadResultDto, UploadImageResponseDto } from './dto/index.js';
import type { UploadImageFile } from './types/upload-image-file.type.js';

const DEFAULT_CATEGORY = 'other';
const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const CATEGORY_PATTERN = /^[a-zA-Z0-9_-]+$/;

/** 负责图片校验、处理和 OSS 上传。 */
@Injectable()
export class UploadService {
  private client: OSS | null = null;

  /** 创建当前实例。 */
  constructor(
    @Inject(ConfigService) private readonly configService: ConfigService,
    @Inject(ResourceUrlService) private readonly resourceUrlService: ResourceUrlService
  ) {}

  /** 上传单张图片并返回公开地址。 */
  async uploadImage(file: UploadImageFile, category = DEFAULT_CATEGORY): Promise<UploadImageResponseDto> {
    const imageConfig = this.getImageConfig();
    const normalizedCategory = this.normalizeCategory(category);
    const input = this.validateFile(file, imageConfig);
    const processed = await this.processImage(input.buffer, imageConfig);
    const key = `images/${normalizedCategory}/${Date.now()}-${randomUUID().slice(0, 8)}.${processed.extension}`;

    try {
      const client = this.getClient();
      await client.put(key, processed.buffer, { headers: { 'Content-Type': processed.contentType } });
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException('图片上传失败，请稍后重试');
    }

    return {
      url: this.resourceUrlService.toPublicUrl(key),
      storageKey: key,
      category: normalizedCategory
    };
  }

  /** 批量上传图片，单个文件失败不影响其他文件。 */
  async batchUploadImages(files: UploadImageFile[], category = DEFAULT_CATEGORY): Promise<BatchUploadResultDto> {
    if (files.length === 0) {
      throw new BadRequestException('请选择要上传的图片');
    }
    const imageConfig = this.getImageConfig();
    if (files.length > imageConfig.maxFiles) {
      throw new BadRequestException(`最多支持上传 ${imageConfig.maxFiles} 张图片`);
    }

    const results = await Promise.allSettled(files.map(file => this.uploadImage(file, category)));
    const success: UploadImageResponseDto[] = [];
    const failed = results.flatMap((result, index) => {
      if (result.status === 'fulfilled') {
        success.push(result.value);
        return [];
      }
      return [{ filename: files[index].originalname, reason: this.getErrorMessage(result.reason) }];
    });

    if (success.length === 0) {
      throw new BadRequestException('所有图片上传失败');
    }
    return { success, failed, totalCount: files.length, successCount: success.length };
  }

  private getImageConfig(): ImageConfig {
    return this.configService.getOrThrow<ImageConfig>(CONFIG_KEYS.image);
  }

  /** 删除已上传的 OSS 对象，用于素材记录写入失败时的补偿清理。 */
  async deleteObject(storageKey: string): Promise<void> {
    await this.getClient().delete(storageKey);
  }

  private getClient(): OSS {
    if (this.client) {
      return this.client;
    }
    const config = this.getOssConfig();
    this.client = new OSS({
      region: config.region,
      bucket: config.bucket,
      accessKeyId: config.accessKeyId,
      accessKeySecret: config.accessKeySecret
    });
    return this.client;
  }

  private getOssConfig(): OssConfig {
    const config = this.configService.get<OssConfig>(CONFIG_KEYS.oss);
    if (!config?.region || !config.bucket || !config.accessKeyId || !config.accessKeySecret) {
      throw new ServiceUnavailableException('图片存储服务未配置');
    }
    return config;
  }

  private validateFile(file: UploadImageFile, config: ImageConfig): UploadImageFile {
    if (!file.buffer || file.buffer.length === 0) {
      throw new BadRequestException('图片文件不能为空');
    }
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      throw new BadRequestException('仅支持 JPEG、PNG、WebP、GIF 格式的图片');
    }
    if (file.size > config.maxFileSize || file.buffer.length > config.maxFileSize) {
      throw new BadRequestException(`图片大小不能超过 ${config.maxFileSize} 字节`);
    }
    return file;
  }

  private normalizeCategory(category: string): string {
    const value = category || DEFAULT_CATEGORY;
    if (value.length > 64 || !CATEGORY_PATTERN.test(value)) {
      throw new BadRequestException('图片分类格式无效');
    }
    return value;
  }

  private async processImage(
    buffer: Buffer,
    config: ImageConfig
  ): Promise<{ buffer: Buffer; extension: string; contentType: string }> {
    try {
      const pipeline = sharp(buffer);
      const metadata = await pipeline.metadata();
      if (!metadata.format || !['jpeg', 'png', 'webp', 'gif'].includes(metadata.format)) {
        throw new Error('unsupported image format');
      }
      if ((metadata.width ?? 0) > config.maxWidth || (metadata.height ?? 0) > config.maxHeight) {
        pipeline.resize(config.maxWidth, config.maxHeight, { fit: 'inside', withoutEnlargement: true });
      }
      if (metadata.format === 'png') {
        return {
          buffer: await pipeline.png({ quality: config.quality }).toBuffer(),
          extension: 'png',
          contentType: 'image/png'
        };
      }
      if (metadata.format === 'webp') {
        return {
          buffer: await pipeline.webp({ quality: config.quality }).toBuffer(),
          extension: 'webp',
          contentType: 'image/webp'
        };
      }
      return {
        buffer: await pipeline.jpeg({ quality: config.quality }).toBuffer(),
        extension: 'jpg',
        contentType: 'image/jpeg'
      };
    } catch {
      throw new BadRequestException('图片处理失败，请检查文件格式');
    }
  }

  private getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : '上传失败';
  }
}
