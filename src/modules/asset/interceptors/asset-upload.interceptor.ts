import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import type { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FilesInterceptor } from '@nestjs/platform-express';
import { finalize } from 'rxjs';
import { BoundedMemoryStorage } from '../../upload/storage/bounded-memory.storage.js';
import { CONFIG_KEYS } from '#/config/config.constants.js';
import type { ImageConfig } from '#/config/config.types.js';

/** 在读取 multipart 前按当前配置构造受内存预算保护的上传拦截器。 */
@Injectable()
export class AssetUploadInterceptor implements NestInterceptor {
  constructor(@Inject(ConfigService) private readonly config: ConfigService) {}

  async intercept(context: ExecutionContext, next: CallHandler) {
    const config = this.config.getOrThrow<ImageConfig>(CONFIG_KEYS.image);
    if (
      !Number.isSafeInteger(config.maxFileSize) ||
      config.maxFileSize < 1 ||
      !Number.isSafeInteger(config.maxFiles) ||
      config.maxFiles < 1
    ) {
      throw new BadRequestException('图片上传配置无效');
    }
    const fileSize = config.maxFileSize;
    const files = config.maxFiles;
    const storage = new BoundedMemoryStorage();
    const Interceptor = FilesInterceptor('files', files, {
      storage,
      limits: { files, fileSize, fields: 2, fieldSize: 128, parts: files + 2 }
    });
    try {
      const result = await new Interceptor().intercept(context, next);
      return result.pipe(finalize(() => storage.dispose()));
    } catch (error) {
      storage.dispose();
      throw error;
    }
  }
}
