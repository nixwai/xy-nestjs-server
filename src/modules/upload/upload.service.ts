import {
  BadRequestException,
  InternalServerErrorException,
  Injectable,
  Inject,
  Logger,
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
import { IMAGE_FORMAT_STRATEGIES, isSupportedImageFormat } from './upload-format.strategy.js';
import type { ImageFormatStrategy } from './upload-format.strategy.js';
import type { ProcessedImage } from './types/processed-image.type.js';

import { UPLOAD_MEMORY_BUDGET } from './storage/bounded-memory.storage.js';

const UPLOAD_CONCURRENCY = 3;
const DEFAULT_CATEGORY = 'other';
const UPLOAD_FAILURE_REASON = '图片上传失败，请稍后重试';
const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const CATEGORY_PATTERN = /^[a-zA-Z0-9_-]+$/;

/** 负责图片校验、处理和 OSS 上传。 */
@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  private client: OSS | null = null;

  constructor(
    @Inject(ConfigService) private readonly configService: ConfigService,
    @Inject(ResourceUrlService) private readonly resourceUrlService: ResourceUrlService
  ) {}

  /** 上传单张图片并返回最终存储对象的元数据。 */
  async uploadImage(file: UploadImageFile, category = DEFAULT_CATEGORY): Promise<UploadImageResponseDto> {
    const config = this.getImageConfig();
    const normalizedCategory = this.normalizeCategory(category);
    const input = this.validateFile(file, config);
    const processed = await this.processImage(input.buffer, config);
    return this.uploadProcessedImage(processed, normalizedCategory);
  }

  /** 在任何上传或图片解码之前同步校验整个批次。 */
  validateBatch(files: readonly UploadImageFile[]): void {
    if (files.length === 0) {
      throw new BadRequestException('请选择要上传的图片');
    }
    const config = this.getImageConfig();
    if (files.length > config.maxFiles) {
      throw new BadRequestException(`最多支持上传 ${config.maxFiles} 张图片`);
    }
    let totalBytes = 0;
    for (const file of files) {
      this.validateFile(file, config);
      totalBytes += file.buffer.length;
      if (totalBytes > UPLOAD_MEMORY_BUDGET) {
        throw new BadRequestException(`本次上传文件总大小不能超过 ${UPLOAD_MEMORY_BUDGET} 字节`);
      }
    }
  }

  /** 全部本地处理成功后才上传，单个远端失败不影响其他文件。 */
  async batchUploadImages(files: UploadImageFile[], category = DEFAULT_CATEGORY): Promise<BatchUploadResultDto> {
    this.validateBatch(files);
    const normalizedCategory = this.normalizeCategory(category);
    const config = this.getImageConfig();
    const processed = await this.processBatch(files, config);
    const results = await this.uploadBatch(processed, normalizedCategory);
    return this.buildBatchResult(files, results);
  }

  private async processBatch(files: readonly UploadImageFile[], config: ImageConfig): Promise<ProcessedImage[]> {
    const processed: ProcessedImage[] = [];
    let totalBytes = 0;
    for (let offset = 0; offset < files.length; offset += UPLOAD_CONCURRENCY) {
      const results = await Promise.allSettled(
        files.slice(offset, offset + UPLOAD_CONCURRENCY).map(file => this.processImage(file.buffer, config))
      );
      for (const result of results) {
        if (result.status === 'rejected') throw result.reason;
        totalBytes += result.value.buffer.length;
        if (totalBytes > UPLOAD_MEMORY_BUDGET) {
          throw new BadRequestException(`处理后图片总大小不能超过 ${UPLOAD_MEMORY_BUDGET} 字节`);
        }
        processed.push(result.value);
      }
    }
    return processed;
  }

  private async uploadBatch(
    processed: readonly ProcessedImage[],
    category: string
  ): Promise<PromiseSettledResult<UploadImageResponseDto>[]> {
    const results: PromiseSettledResult<UploadImageResponseDto>[] = [];
    for (let offset = 0; offset < processed.length; offset += UPLOAD_CONCURRENCY) {
      const batch = await Promise.allSettled(
        processed.slice(offset, offset + UPLOAD_CONCURRENCY).map(image => this.uploadProcessedImage(image, category))
      );
      results.push(...batch);
    }
    return results;
  }

  private buildBatchResult(
    files: readonly UploadImageFile[],
    results: readonly PromiseSettledResult<UploadImageResponseDto>[]
  ): BatchUploadResultDto {
    const success: UploadImageResponseDto[] = [];
    const failed: { filename: string; reason: string }[] = [];
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') success.push(result.value);
      else failed.push({ filename: files[index].originalname, reason: UPLOAD_FAILURE_REASON });
    });
    if (success.length === 0) throw new BadRequestException('所有图片上传失败');
    return { success, failed, totalCount: files.length, successCount: success.length };
  }

  private async uploadProcessedImage(image: ProcessedImage, category: string): Promise<UploadImageResponseDto> {
    const { buffer, extension, ...metadata } = image;
    const key = `images/${category}/${Date.now()}-${randomUUID().slice(0, 8)}.${extension}`;
    const client = this.getClient();
    let uploaded = false;
    try {
      await client.put(key, buffer, { headers: { 'Content-Type': metadata.mimeType } });
      uploaded = true;
      return { url: this.resourceUrlService.toPublicUrl(key), storageKey: key, category, ...metadata };
    } catch (error) {
      this.logger.error(`图片上传或公开地址构造失败: ${key}`, error instanceof Error ? error.stack : undefined);
      if (uploaded) {
        try {
          await client.delete(key);
          this.logger.warn(`公开地址构造失败，已补偿删除 OSS 对象: ${key}`);
        } catch (cleanupError) {
          this.logger.error(
            `OSS 对象补偿删除失败，需人工处理: ${key}`,
            cleanupError instanceof Error ? cleanupError.stack : undefined
          );
        }
      }
      throw new InternalServerErrorException(UPLOAD_FAILURE_REASON);
    }
  }

  private getImageConfig(): ImageConfig {
    return this.configService.getOrThrow<ImageConfig>(CONFIG_KEYS.image);
  }

  /** 删除已上传的 OSS 对象，用于素材记录写入失败时的补偿清理。 */
  async deleteObject(storageKey: string): Promise<void> {
    await this.getClient().delete(storageKey);
  }

  private getClient(): OSS {
    if (this.client) return this.client;
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
    if (!file?.buffer || file.buffer.length === 0) throw new BadRequestException('图片文件不能为空');
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
    if (value.length > 64 || !CATEGORY_PATTERN.test(value)) throw new BadRequestException('图片分类格式无效');
    return value;
  }

  private async processImage(buffer: Buffer, config: ImageConfig): Promise<ProcessedImage> {
    try {
      const pipeline = sharp(buffer);
      const metadata = await pipeline.metadata();
      const strategy = this.resolveImageFormatStrategy(metadata.format);
      const resized = pipeline.resize(config.maxWidth, config.maxHeight, {
        fit: 'inside',
        withoutEnlargement: true
      });
      const encoded = strategy.apply(resized, config.quality);
      const { data, info } = await encoded.toBuffer({ resolveWithObject: true });
      return {
        buffer: data,
        extension: strategy.extension,
        mimeType: strategy.mimeType,
        size: info.size,
        width: info.width,
        height: info.height
      };
    } catch {
      throw new BadRequestException('图片处理失败，请检查文件格式');
    }
  }

  private resolveImageFormatStrategy(format: string | undefined): ImageFormatStrategy {
    if (!isSupportedImageFormat(format)) throw new Error('unsupported image format');
    return IMAGE_FORMAT_STRATEGIES[format];
  }
}
