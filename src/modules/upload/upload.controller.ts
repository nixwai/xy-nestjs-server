import {
  BadRequestException,
  Body,
  Controller,
  Inject,
  Post,
  UploadedFile,
  UploadedFiles,
  UseInterceptors
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiCommonResponses, ApiOkResponseData } from '#/common/decorators/index.js';
import { Authenticated } from '../authorization/decorators/index.js';
import { BatchUploadImagesDto, BatchUploadResultDto, UploadImageDto, UploadImageResponseDto } from './dto/index.js';
import { UploadService } from './upload.service.js';
import type { UploadImageFile } from './types/upload-image-file.type.js';
import type { UploadImageResult } from './types/upload-result.type.js';

/** 图片上传接口。 */
@ApiTags('图片上传')
@ApiBearerAuth()
@ApiCommonResponses()
@Controller('upload')
@Authenticated()
export class UploadController {
  /** 创建当前实例。 */
  constructor(@Inject(UploadService) private readonly uploadService: UploadService) {}

  /** 上传单张图片。 */
  @Post('image')
  @UseInterceptors(FileInterceptor('file', { limits: { files: 1 } }))
  @ApiOperation({ summary: '上传单张图片' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UploadImageDto })
  @ApiOkResponseData(UploadImageResponseDto, { description: '图片上传成功。' })
  async uploadImage(@Body() dto: UploadImageDto, @UploadedFile() file?: UploadImageFile) {
    if (!file) throw new BadRequestException('请选择要上传的图片');
    return this.toPublicImage(await this.uploadService.uploadImage(file, dto.category));
  }

  /** 批量上传图片。 */
  @Post('batch-images')
  @UseInterceptors(FilesInterceptor('files'))
  @ApiOperation({ summary: '批量上传图片' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: BatchUploadImagesDto })
  @ApiOkResponseData(BatchUploadResultDto, { description: '批量图片上传完成。' })
  async batchUploadImages(@Body() dto: BatchUploadImagesDto, @UploadedFiles() files?: UploadImageFile[]) {
    const result = await this.uploadService.batchUploadImages(files ?? [], dto.category);
    return { ...result, success: result.success.map(item => this.toPublicImage(item)) };
  }

  private toPublicImage(item: UploadImageResult): UploadImageResponseDto {
    const { storageKey: _storageKey, ...publicResult } = item;
    return publicResult;
  }
}
