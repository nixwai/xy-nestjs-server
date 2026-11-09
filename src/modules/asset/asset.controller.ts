import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  UploadedFiles,
  UseInterceptors
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiExtraModels, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ApiCommonResponses, ApiOkResponseData, ApiOkResponseEmpty, ApiPageQuery } from '#/common/decorators/index.js';
import { RequirePermission } from '../authorization/decorators/index.js';
import { PermissionCode } from '../authorization/constants/index.js';
import { CurrentAdmin } from '../auth/decorators/index.js';
import type { AdminJwtPayload } from '../auth/types/jwt.types.js';
import type { UploadImageFile } from '../upload/types/upload-image-file.type.js';
import { AssetService } from './asset.service.js';
import {
  AssetImageQueryDto,
  BatchAssetUploadDto,
  CreateAssetFolderDto,
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
@ApiExtraModels(AssetImageQueryDto)
@ApiBearerAuth()
@ApiCommonResponses()
@Controller('asset')
export class AssetController {
  constructor(@Inject(AssetService) private readonly service: AssetService) {}
  @Get('folders')
  @RequirePermission(PermissionCode.ASSET_FOLDER_READ)
  @ApiOperation({ summary: '查询素材文件夹' })
  @ApiOkResponseData(AssetFolderListResponseDto)
  async listFolders(@CurrentAdmin() admin: AdminJwtPayload) {
    const items = await this.service.listFolders(admin.sub);
    return { items, total: items.length };
  }
  @Get('folders/all')
  @RequirePermission(PermissionCode.ASSET_FOLDER_READ_ALL)
  @ApiOperation({ summary: '查询全部素材文件夹' })
  @ApiOkResponseData(AssetFolderListResponseDto)
  async listAllFolders(@CurrentAdmin() admin: AdminJwtPayload) {
    const items = await this.service.listFolders(admin.sub);
    return { items, total: items.length };
  }
  @Post('folders')
  @RequirePermission(PermissionCode.ASSET_FOLDER_CREATE)
  @ApiOperation({ summary: '创建素材文件夹' })
  @ApiBody({ type: CreateAssetFolderDto })
  @ApiOkResponseData(AssetFolderResponseDto)
  createFolder(@CurrentAdmin() admin: AdminJwtPayload, @Body() dto: CreateAssetFolderDto) {
    return this.service.createFolder(admin.sub, dto);
  }
  @Patch('folders/:id')
  @RequirePermission(PermissionCode.ASSET_FOLDER_UPDATE)
  @ApiOperation({ summary: '更新素材文件夹' })
  @ApiBody({ type: UpdateAssetFolderDto })
  @ApiOkResponseData(AssetFolderResponseDto)
  updateFolder(@CurrentAdmin() admin: AdminJwtPayload, @Param('id') id: string, @Body() dto: UpdateAssetFolderDto) {
    return this.service.updateFolder(admin.sub, id, dto);
  }
  @Delete('folders/:id')
  @RequirePermission(PermissionCode.ASSET_FOLDER_DELETE)
  @ApiOperation({ summary: '删除素材文件夹' })
  @ApiOkResponseEmpty()
  deleteFolder(@CurrentAdmin() admin: AdminJwtPayload, @Param('id') id: string) {
    return this.service.deleteFolder(admin.sub, id);
  }
  @Get('images')
  @RequirePermission(PermissionCode.ASSET_IMAGE_READ)
  @ApiOperation({ summary: '查询图片素材' })
  @ApiPageQuery()
  @ApiQuery({ name: 'folderId', required: false, type: String })
  @ApiQuery({ name: 'keyword', required: false, type: String })
  @ApiOkResponseData(AssetImagePageResponseDto)
  listImages(@CurrentAdmin() admin: AdminJwtPayload, @Query() q: AssetImageQueryDto) {
    return this.service.listImages(admin.sub, q);
  }
  @Get('images/all')
  @RequirePermission(PermissionCode.ASSET_IMAGE_READ_ALL)
  @ApiOperation({ summary: '查询全部图片素材' })
  @ApiPageQuery()
  @ApiQuery({ name: 'folderId', required: false, type: String })
  @ApiQuery({ name: 'keyword', required: false, type: String })
  @ApiOkResponseData(AssetImagePageResponseDto)
  listAllImages(@CurrentAdmin() admin: AdminJwtPayload, @Query() q: AssetImageQueryDto) {
    return this.service.listImages(admin.sub, q);
  }
  @Post('images/batch')
  @RequirePermission(PermissionCode.ASSET_IMAGE_UPLOAD)
  @ApiOperation({ summary: '批量上传图片素材' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: BatchAssetUploadDto })
  @ApiOkResponseData(BatchAssetUploadResponseDto)
  @UseInterceptors(
    FilesInterceptor('files', 50, { storage: memoryStorage(), limits: { files: 50, fileSize: 52428800 } })
  )
  upload(
    @CurrentAdmin() admin: AdminJwtPayload,
    @Body('folderId') folderId: string | undefined,
    @UploadedFiles() files?: UploadImageFile[]
  ) {
    if (!files?.length) throw new BadRequestException('请选择要上传的图片');
    return this.service.upload(admin.sub, files, folderId);
  }
  @Patch('images/:id/folder')
  @RequirePermission(PermissionCode.ASSET_IMAGE_MOVE)
  @ApiOperation({ summary: '移动图片素材' })
  @ApiBody({ type: MoveAssetImageDto })
  @ApiOkResponseData(AssetImageResponseDto)
  moveImage(@CurrentAdmin() admin: AdminJwtPayload, @Param('id') id: string, @Body() dto: MoveAssetImageDto) {
    return this.service.moveImage(admin.sub, id, dto.folderId);
  }
  @Delete('images/:id')
  @RequirePermission(PermissionCode.ASSET_IMAGE_DELETE)
  @ApiOperation({ summary: '删除图片素材' })
  @ApiOkResponseEmpty()
  deleteImage(@CurrentAdmin() admin: AdminJwtPayload, @Param('id') id: string) {
    return this.service.deleteImage(admin.sub, id);
  }
}
