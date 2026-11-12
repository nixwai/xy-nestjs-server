import { ConfigService } from '@nestjs/config';
import { CONFIG_KEYS } from '#/config/config.constants.js';
import type { ImageConfig } from '#/config/config.types.js';
import { UploadService } from '../upload/upload.service.js';
import { AssetUploadLimitsResponseDto } from './dto/asset-response.dto.js';
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Inject,
  Post,
  Query,
  UploadedFiles,
  UseInterceptors
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiExtraModels, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ApiCommonResponses, ApiOkResponseData, ApiOkResponseEmpty, ApiPageQuery } from '#/common/decorators/index.js';
import { Authenticated, RequirePermission } from '../authorization/decorators/index.js';
import { PermissionCode } from '../authorization/constants/index.js';
import { CurrentAdmin } from '../auth/decorators/index.js';
import type { AdminJwtPayload } from '../auth/types/jwt.types.js';
import type { UploadImageFile } from '../upload/types/upload-image-file.type.js';
import { AssetUploadInterceptor } from './interceptors/asset-upload.interceptor.js';
import {
  toAssetFolderResponse,
  toAssetImageResponse,
  toAssetImagePage,
  toAssetUploadResponse,
  toAssetOwnersResponse
} from './mappers/asset-response.mapper.js';
import { AssetFolderService } from './asset-folder.service.js';
import { AssetImageService } from './asset-image.service.js';
import { AssetService } from './asset.service.js';
import {
  AssetIdParamDto,
  AssetOwnerQueryDto,
  AssetOwnerListResponseDto,
  AssetImageQueryDto,
  BatchAssetUploadDto,
  CreateAssetFolderDto,
  DeleteAssetFolderDto,
  DeleteAssetImageDto,
  MoveAssetImageDto,
  UpdateAssetFolderDto
} from './dto/index.js';
import {
  AssetFolderListResponseDto,
  AssetFolderResponseDto,
  AssetImagePageResponseDto,
  AssetImageResponseDto,
  BatchAssetUploadResponseDto
} from './dto/index.js';

@ApiTags('素材管理')
@ApiExtraModels(AssetImageQueryDto, AssetIdParamDto, AssetOwnerQueryDto)
@ApiBearerAuth()
@ApiCommonResponses()
@Controller('asset')
export class AssetController {
  constructor(
    @Inject(AssetService) private readonly service: AssetService,
    @Inject(AssetFolderService) private readonly folders: AssetFolderService,
    @Inject(AssetImageService) private readonly images: AssetImageService,
    @Inject(UploadService) private readonly uploadService: UploadService,
    @Inject(ConfigService) private readonly config: ConfigService
  ) {}
  @Get('upload-limits')
  @RequirePermission(PermissionCode.ASSET_IMAGE_UPLOAD)
  @ApiOperation({ summary: '查询素材上传限制' })
  @ApiOkResponseData(AssetUploadLimitsResponseDto)
  uploadLimits(): AssetUploadLimitsResponseDto {
    const image = this.config.getOrThrow<ImageConfig>(CONFIG_KEYS.image);
    return {
      maxFiles: image.maxFiles,
      maxFileSize: image.maxFileSize,
      maxBatchSize: this.uploadService.getMemoryBudget()
    };
  }

  /** 所有者可见性由素材服务按动作权限判断，不依赖管理员列表权限。 */
  @Get('owners')
  @Authenticated()
  @ApiOperation({ summary: '查询素材所有者' })
  @ApiOkResponseData(AssetOwnerListResponseDto)
  async listOwners(@CurrentAdmin() admin: AdminJwtPayload) {
    return toAssetOwnersResponse(await this.service.listOwners(admin.sub));
  }

  @Get('folders')
  @RequirePermission(PermissionCode.ASSET_FOLDER_READ)
  @ApiOperation({ summary: '查询素材文件夹' })
  @ApiQuery({ name: 'ownerId', required: false, type: String })
  @ApiOkResponseData(AssetFolderListResponseDto)
  async listFolders(@CurrentAdmin() admin: AdminJwtPayload, @Query() query: AssetOwnerQueryDto) {
    const items = await this.folders.list(admin.sub, query.ownerId);
    return { items: items.map(toAssetFolderResponse), total: items.length };
  }

  @Get('folders/all')
  @RequirePermission(PermissionCode.ASSET_FOLDER_READ_ALL)
  @ApiOperation({ summary: '查询全部素材文件夹' })
  @ApiQuery({ name: 'ownerId', required: false, type: String })
  @ApiOkResponseData(AssetFolderListResponseDto)
  async listAllFolders(@CurrentAdmin() admin: AdminJwtPayload, @Query() query: AssetOwnerQueryDto) {
    const items = await this.folders.list(admin.sub, query.ownerId, true);
    return { items: items.map(toAssetFolderResponse), total: items.length };
  }

  @Post('folders')
  @RequirePermission(PermissionCode.ASSET_FOLDER_CREATE)
  @ApiOperation({ summary: '创建素材文件夹' })
  @ApiBody({ type: CreateAssetFolderDto })
  @ApiOkResponseData(AssetFolderResponseDto)
  createFolder(@CurrentAdmin() admin: AdminJwtPayload, @Body() dto: CreateAssetFolderDto) {
    return this.folders.create(admin.sub, dto).then(toAssetFolderResponse);
  }

  @Post('folders/update')
  @RequirePermission(PermissionCode.ASSET_FOLDER_UPDATE)
  @ApiOperation({ summary: '更新素材文件夹' })
  @ApiBody({ type: UpdateAssetFolderDto })
  @ApiOkResponseData(AssetFolderResponseDto)
  updateFolder(@CurrentAdmin() admin: AdminJwtPayload, @Body() dto: UpdateAssetFolderDto) {
    return this.folders.update(admin.sub, dto.id, dto).then(toAssetFolderResponse);
  }

  @Post('folders/soft-delete')
  @RequirePermission(PermissionCode.ASSET_FOLDER_DELETE)
  @ApiOperation({ summary: '删除素材文件夹' })
  @ApiBody({ type: DeleteAssetFolderDto })
  @ApiOkResponseEmpty()
  deleteFolder(@CurrentAdmin() admin: AdminJwtPayload, @Body() dto: DeleteAssetFolderDto) {
    return this.folders.delete(admin.sub, dto.id, dto.ownerId);
  }

  @Get('images')
  @RequirePermission(PermissionCode.ASSET_IMAGE_READ)
  @ApiOperation({ summary: '查询图片素材' })
  @ApiPageQuery()
  @ApiQuery({ name: 'folderId', required: false, type: String })
  @ApiQuery({ name: 'keyword', required: false, type: String })
  @ApiQuery({ name: 'unclassified', required: false, type: Boolean })
  @ApiQuery({ name: 'ownerId', required: false, type: String })
  @ApiOkResponseData(AssetImagePageResponseDto)
  listImages(@CurrentAdmin() admin: AdminJwtPayload, @Query() q: AssetImageQueryDto) {
    return this.images.list(admin.sub, q).then(toAssetImagePage);
  }

  @Get('images/all')
  @RequirePermission(PermissionCode.ASSET_IMAGE_READ_ALL)
  @ApiOperation({ summary: '查询全部图片素材' })
  @ApiPageQuery()
  @ApiQuery({ name: 'folderId', required: false, type: String })
  @ApiQuery({ name: 'keyword', required: false, type: String })
  @ApiQuery({ name: 'unclassified', required: false, type: Boolean })
  @ApiQuery({ name: 'ownerId', required: false, type: String })
  @ApiOkResponseData(AssetImagePageResponseDto)
  listAllImages(@CurrentAdmin() admin: AdminJwtPayload, @Query() q: AssetImageQueryDto) {
    return this.images.list(admin.sub, q, true).then(toAssetImagePage);
  }

  @Post('images/batch')
  @RequirePermission(PermissionCode.ASSET_IMAGE_UPLOAD)
  @ApiOperation({
    summary: '批量上传图片素材',
    description:
      '单文件大小及数量遵循 image 配置；单请求文件总内存预算为 64 MiB，超过预算返回业务错误，不写入本地磁盘。'
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: BatchAssetUploadDto })
  @ApiOkResponseData(BatchAssetUploadResponseDto)
  @UseInterceptors(AssetUploadInterceptor)
  upload(
    @CurrentAdmin() admin: AdminJwtPayload,
    @Body() dto: BatchAssetUploadDto,
    @UploadedFiles() files?: UploadImageFile[]
  ) {
    if (!files?.length) throw new BadRequestException('请选择要上传的图片');
    return this.images.upload(admin.sub, files, dto.folderId, dto.ownerId).then(toAssetUploadResponse);
  }

  @Post('images/move')
  @RequirePermission(PermissionCode.ASSET_IMAGE_MOVE)
  @ApiOperation({ summary: '移动图片素材' })
  @ApiBody({ type: MoveAssetImageDto })
  @ApiOkResponseData(AssetImageResponseDto)
  moveImage(@CurrentAdmin() admin: AdminJwtPayload, @Body() dto: MoveAssetImageDto) {
    return this.images.move(admin.sub, dto.id, dto.folderId, dto.ownerId).then(toAssetImageResponse);
  }

  @Post('images/soft-delete')
  @RequirePermission(PermissionCode.ASSET_IMAGE_DELETE)
  @ApiOperation({ summary: '删除图片素材' })
  @ApiBody({ type: DeleteAssetImageDto })
  @ApiOkResponseEmpty()
  deleteImage(@CurrentAdmin() admin: AdminJwtPayload, @Body() dto: DeleteAssetImageDto) {
    return this.images.delete(admin.sub, dto.id, dto.ownerId);
  }
}
