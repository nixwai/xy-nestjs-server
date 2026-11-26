import { ResourceUrlModule } from '#/common/services/index.js';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import { CONFIG_KEYS } from '#/config/config.constants.js';
import type { ImageConfig } from '#/config/config.types.js';
import { RequestBoundedMemoryStorage } from './storage/bounded-memory.storage.js';
import { AliOssObjectStorage } from './storage/ali-oss.object-storage.js';
import { OBJECT_STORAGE } from './types/upload-result.type.js';
import { UploadController } from './upload.controller.js';
import { UploadService } from './upload.service.js';

/** 阿里 OSS 图片上传模块。 */
@Module({
  imports: [
    ResourceUrlModule,
    MulterModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const config = configService.getOrThrow<ImageConfig>(CONFIG_KEYS.image);
        return {
          storage: new RequestBoundedMemoryStorage(),
          limits: { fileSize: config.maxFileSize, files: config.maxFiles }
        };
      }
    })
  ],
  controllers: [UploadController],
  providers: [UploadService, { provide: OBJECT_STORAGE, useClass: AliOssObjectStorage }],
  exports: [UploadService, OBJECT_STORAGE]
})
export class UploadModule {}
