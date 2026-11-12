import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  ServiceUnavailableException
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import sharp from 'sharp';
import { CONFIG_KEYS } from '#/config/config.constants.js';
import type { ImageConfig } from '#/config/config.types.js';
import type { UploadImageFile } from './types/upload-image-file.type.js';
import type { ProcessedImage } from './types/processed-image.type.js';
import { OBJECT_STORAGE } from './types/upload-result.type.js';
import type { ObjectStorage, UploadImageResult } from './types/upload-result.type.js';
import { UPLOAD_CONCURRENCY, UPLOAD_MEMORY_BUDGET } from './upload.constants.js';
import { IMAGE_FORMAT_STRATEGIES, isSupportedImageFormat } from './upload-format.strategy.js';
import type { ImageFormatStrategy } from './upload-format.strategy.js';
import { ImageBatchUploadException } from './errors/index.js';
import type { ImageBatchUploadResult } from './types/upload-result.type.js';

const DEFAULT_CATEGORY = 'other';
const UPLOAD_FAILURE_REASON = '图片上传失败，请稍后重试';
const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const CATEGORY_PATTERN = /^[a-zA-Z0-9_-]+$/;
type LegacyUrlService = { toPublicUrl(key: string): string };
type StorageDependency = ObjectStorage | LegacyUrlService;

/** 负责图片校验、处理和对象存储上传。 */
@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  private readonly storage: ObjectStorage;
  private readonly legacy: boolean;
  private client: {
    put: (key: string, body: Buffer, options: object) => Promise<unknown>;
    delete: (key: string) => Promise<unknown>;
  } | null = null;

  constructor(
    @Inject(ConfigService) private readonly configService: ConfigService,
    @Inject(OBJECT_STORAGE) dependency: StorageDependency
  ) {
    this.legacy = !('put' in dependency);
    this.storage = this.legacy
      ? this.createLegacyStorage(dependency as LegacyUrlService)
      : (dependency as ObjectStorage);
  }

  /** 返回单次上传请求允许占用的最大内存。 */
  getMemoryBudget(): number {
    return UPLOAD_MEMORY_BUDGET;
  }

  /** 上传单张图片并返回内部结果，控制器负责映射公开字段。 */
  async uploadImage(file: UploadImageFile, category = DEFAULT_CATEGORY): Promise<UploadImageResult> {
    const config = this.getImageConfig();
    const normalizedCategory = this.normalizeCategory(category);
    this.assertLegacyStorageConfigured();
    const processed = await this.processImage(this.validateFile(file, config).buffer, config);
    return this.uploadProcessedImage(processed, normalizedCategory);
  }

  /** 在处理和上传前校验整个批次。 */
  validateBatch(files: readonly UploadImageFile[]): void {
    if (!files.length) throw new BadRequestException('请选择要上传的图片');
    const config = this.getImageConfig();
    if (files.length > config.maxFiles) throw new BadRequestException(`最多支持上传 ${config.maxFiles} 张图片`);
    let totalBytes = 0;
    for (const file of files) {
      this.validateFile(file, config);
      totalBytes += file.buffer.length;
      if (totalBytes > UPLOAD_MEMORY_BUDGET)
        throw new BadRequestException(`本次上传文件总大小不能超过 ${UPLOAD_MEMORY_BUDGET} 字节`);
    }
  }

  /** 批量处理图片并按输入顺序返回成功和失败明细。 */
  async batchUploadImages(files: UploadImageFile[], category = DEFAULT_CATEGORY): Promise<ImageBatchUploadResult> {
    this.validateBatch(files);
    const normalizedCategory = this.normalizeCategory(category);
    this.assertLegacyStorageConfigured();
    const processed = await this.processBatch(files, this.getImageConfig());
    const results = await this.uploadBatch(processed, normalizedCategory);
    const success: UploadImageResult[] = [];
    const failed: { filename: string; reason: string }[] = [];
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') success.push(result.value);
      else failed.push({ filename: files[index].originalname, reason: UPLOAD_FAILURE_REASON });
    });
    if (!success.length)
      throw new ImageBatchUploadException({ success, failed, totalCount: files.length, successCount: 0 });
    return { success, failed, totalCount: files.length, successCount: success.length };
  }

  /** 删除对象存储中的对象，用于入库失败补偿。 */
  deleteObject(storageKey: string): Promise<void> {
    return this.storage.delete(storageKey);
  }

  private createLegacyStorage(urls: LegacyUrlService): ObjectStorage {
    return {
      put: async (key, body, mimeType) => {
        if (!this.client) throw new Error('图片存储服务未配置');
        await this.client.put(key, body, { headers: { 'Content-Type': mimeType } });
        try {
          return { storageKey: key, url: urls.toPublicUrl(key) };
        } catch (error) {
          try {
            await this.client.delete(key);
            this.logger.warn(`公开地址构造失败，已补偿删除 OSS 对象: ${key}`);
          } catch (cleanupError) {
            this.logger.error(
              `OSS 对象补偿删除失败，需人工处理: ${key}`,
              cleanupError instanceof Error ? cleanupError.stack : undefined
            );
          }
          throw error;
        }
      },
      delete: async key => {
        if (!this.client) throw new Error('图片存储服务未配置');
        await this.client.delete(key);
      }
    };
  }

  private assertLegacyStorageConfigured(): void {
    if (this.legacy && typeof this.configService.get === 'function' && !this.configService.get('oss')) {
      throw new ServiceUnavailableException('图片存储服务未配置');
    }
  }

  private async processBatch(files: readonly UploadImageFile[], config: ImageConfig): Promise<ProcessedImage[]> {
    const output: ProcessedImage[] = [];
    let totalBytes = 0;
    for (let offset = 0; offset < files.length; offset += UPLOAD_CONCURRENCY) {
      const results = await Promise.allSettled(
        files.slice(offset, offset + UPLOAD_CONCURRENCY).map(file => this.processImage(file.buffer, config))
      );
      const rejected = results.find(result => result.status === 'rejected');
      if (rejected?.status === 'rejected') throw rejected.reason;
      for (const result of results) {
        if (result.status === 'rejected') throw result.reason;
        totalBytes += result.value.buffer.length;
        if (totalBytes > UPLOAD_MEMORY_BUDGET)
          throw new BadRequestException(`处理后图片总大小不能超过 ${UPLOAD_MEMORY_BUDGET} 字节`);
        output.push(result.value);
      }
    }
    return output;
  }

  private async uploadBatch(
    processed: readonly ProcessedImage[],
    category: string
  ): Promise<PromiseSettledResult<UploadImageResult>[]> {
    const output: PromiseSettledResult<UploadImageResult>[] = [];
    for (let offset = 0; offset < processed.length; offset += UPLOAD_CONCURRENCY) {
      output.push(
        ...(await Promise.allSettled(
          processed.slice(offset, offset + UPLOAD_CONCURRENCY).map(image => this.uploadProcessedImage(image, category))
        ))
      );
    }
    return output;
  }

  private async uploadProcessedImage(image: ProcessedImage, category: string): Promise<UploadImageResult> {
    const { buffer, extension, ...metadata } = image;
    const key = `images/${category}/${Date.now()}-${randomUUID().slice(0, 8)}.${extension}`;
    try {
      const stored = await this.storage.put(key, buffer, metadata.mimeType);
      return { ...metadata, category, storageKey: stored.storageKey, url: stored.url };
    } catch (error) {
      this.logger.error(`图片上传失败: ${key}`, error instanceof Error ? error.stack : undefined);
      throw new InternalServerErrorException(UPLOAD_FAILURE_REASON);
    }
  }

  private getImageConfig(): ImageConfig {
    return this.configService.getOrThrow<ImageConfig>(CONFIG_KEYS.image);
  }
  private validateFile(file: UploadImageFile, config: ImageConfig): UploadImageFile {
    if (!file?.buffer?.length) throw new BadRequestException('图片文件不能为空');
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) throw new BadRequestException('仅支持 JPEG、PNG、WebP、GIF 格式的图片');
    if (file.size > config.maxFileSize || file.buffer.length > config.maxFileSize)
      throw new BadRequestException(`图片大小不能超过 ${config.maxFileSize} 字节`);
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
      const strategy = this.resolveImageFormatStrategy((await pipeline.metadata()).format);
      const { data, info } = await strategy
        .apply(
          pipeline.resize(config.maxWidth, config.maxHeight, { fit: 'inside', withoutEnlargement: true }),
          config.quality
        )
        .toBuffer({ resolveWithObject: true });
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
