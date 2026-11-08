import { Module } from '@nestjs/common';
import { UploadController } from './upload.controller.js';
import { UploadService } from './upload.service.js';
import { ResourceUrlService } from '#/common/services/resource-url.service.js';

/** 阿里 OSS 图片上传模块。 */
@Module({
  controllers: [UploadController],
  providers: [UploadService, ResourceUrlService],
  exports: [UploadService, ResourceUrlService]
})
export class UploadModule {}
