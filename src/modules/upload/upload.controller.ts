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
import { memoryStorage } from 'multer';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiCommonResponses, ApiOkResponseData } from '#/common/decorators/index.js';
import { Authenticated } from '../authorization/decorators/index.js';
import { BatchUploadImagesDto, BatchUploadResultDto, UploadImageDto, UploadImageResponseDto } from './dto/index.js';
import { UploadService } from './upload.service.js';
import type { UploadImageFile } from './types/upload-image-file.type.js';

const MAX_MULTIPART_FILE_SIZE = 50 * 1024 * 1024;
const MAX_MULTIPART_FILES = 50;

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
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage(), limits: { fileSize: MAX_MULTIPART_FILE_SIZE } }))
  @ApiOperation({ summary: '上传单张图片' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UploadImageDto })
  @ApiOkResponseData(UploadImageResponseDto, { description: '图片上传成功。' })
  async uploadImage(@Body() dto: UploadImageDto, @UploadedFile() file?: UploadImageFile) {
    if (!file) {
      throw new BadRequestException('请选择要上传的图片');
    }
    return this.uploadService.uploadImage(file, dto.category);
  }

  /** 批量上传图片。 */
  @Post('batch-images')
  @UseInterceptors(
    FilesInterceptor('files', MAX_MULTIPART_FILES, {
      storage: memoryStorage(),
      limits: { fileSize: MAX_MULTIPART_FILE_SIZE, files: MAX_MULTIPART_FILES }
    })
  )
  @ApiOperation({ summary: '批量上传图片' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: BatchUploadImagesDto })
  @ApiOkResponseData(BatchUploadResultDto, { description: '批量图片上传完成。' })
  async batchUploadImages(@Body() dto: BatchUploadImagesDto, @UploadedFiles() files?: UploadImageFile[]) {
    return this.uploadService.batchUploadImages(files ?? [], dto.category);
  }
}
