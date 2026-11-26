import { Body, Controller, Get, Inject, Post, Query, UploadedFiles, UseInterceptors } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ApiCommonResponses, ApiOkResponseData } from '#/common/decorators/index.js';
import { ResourceUrlService } from '#/common/services/index.js';
import { CurrentAdmin } from '../auth/admin/decorators/index.js';
import type { AdminJwtPayload } from '../auth/admin/types/admin-jwt.types.js';
import type { UploadImageFile } from '../upload/types/upload-image-file.type.js';
import { PermissionCode } from '../authorization/constants/index.js';
import { RequirePermission } from '../authorization/decorators/index.js';
import { AssetImageService } from './asset-image.service.js';
import {
  AssetImageListQueryDto,
  AssetImageSearchQueryDto,
  AssetImagePageResponseDto,
  AssetImageUploadDto,
  AssetImageUploadResultDto
} from './dto/index.js';

/** 素材图片管理接口。 */
@ApiTags('素材图片')
@ApiBearerAuth()
@ApiCommonResponses()
@Controller('asset/image')
export class AssetImageController {
  /** 创建当前实例。 */
  constructor(
    @Inject(AssetImageService) private readonly images: AssetImageService,
    @Inject(ResourceUrlService) private readonly resourceUrls: ResourceUrlService
  ) {}

  /** 分页查询当前文件夹直属的素材图片。 */
  @Get('list')
  @RequirePermission(PermissionCode.ASSET_IMAGE_READ)
  @ApiQuery({ name: 'folderId', required: true, type: String, description: '直属文件夹 ID。' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: '页码，从 1 开始。' })
  @ApiQuery({ name: 'pageSize', required: false, type: Number, description: '每页条数，范围 1-100。' })
  @ApiOperation({ summary: '分页查询素材图片' })
  @ApiOkResponseData(AssetImagePageResponseDto)
  async list(
    @CurrentAdmin() admin: AdminJwtPayload,
    @Query() query: AssetImageListQueryDto = new AssetImageListQueryDto()
  ) {
    const result = await this.images.list(admin.sub, query);
    return { ...result, items: this.resourceUrls.toPublicResources(result.items) };
  }

  /** 按选中范围搜索素材图片，文件夹范围会递归包含全部子孙文件夹。 */
  @Get('search')
  @RequirePermission(PermissionCode.ASSET_IMAGE_READ)
  @ApiQuery({ name: 'keyword', required: true, type: String, description: '图片原始文件名关键词。' })
  @ApiQuery({ name: 'folderId', required: false, type: String, description: '限定为该文件夹及其全部子孙文件夹。' })
  @ApiQuery({ name: 'ownerId', required: false, type: String, description: '限定为该账号名下全部文件夹。' })
  @ApiQuery({ name: 'all', required: false, type: Boolean, description: '未限定范围时是否覆盖全部账号。' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: '页码，从 1 开始。' })
  @ApiQuery({ name: 'pageSize', required: false, type: Number, description: '每页条数，范围 1-100。' })
  @ApiOperation({ summary: '搜索素材图片' })
  @ApiOkResponseData(AssetImagePageResponseDto)
  async search(
    @CurrentAdmin() admin: AdminJwtPayload,
    @Query() query: AssetImageSearchQueryDto = new AssetImageSearchQueryDto()
  ) {
    const result = await this.images.search(admin.sub, query);
    return { ...result, items: this.resourceUrls.toPublicResources(result.items) };
  }

  /** 批量上传素材图片到指定文件夹。 */
  @Post('upload')
  @RequirePermission(PermissionCode.ASSET_IMAGE_UPLOAD)
  @UseInterceptors(FilesInterceptor('files'))
  @ApiOperation({ summary: '批量上传素材图片' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: AssetImageUploadDto })
  @ApiOkResponseData(AssetImageUploadResultDto, { description: '素材图片上传完成。' })
  async upload(
    @CurrentAdmin() admin: AdminJwtPayload,
    @Body() dto: AssetImageUploadDto,
    @UploadedFiles() files?: UploadImageFile[]
  ) {
    const result = await this.images.upload(admin.sub, dto.folderId, files ?? []);
    return {
      ...result,
      success: this.resourceUrls.toPublicResources(result.success)
    };
  }
}
