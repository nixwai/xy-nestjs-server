import { Body, Controller, Get, Inject, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiCommonResponses, ApiOkResponseData, ApiOkResponseEmpty } from '#/common/decorators/index.js';
import { CurrentAdmin } from '../auth/decorators/index.js';
import type { AdminJwtPayload } from '../auth/types/jwt.types.js';
import { PermissionCode } from '../authorization/constants/index.js';
import { RequirePermission } from '../authorization/decorators/index.js';
import { AssetFolderService } from './asset-folder.service.js';
import {
  AssetFolderResponseDto,
  AssetFolderTreeResponseDto,
  CreateAssetFolderDto,
  SoftDeleteAssetFolderDto,
  UpdateAssetFolderDto
} from './dto/index.js';

/** 素材文件夹管理接口。 */
@ApiTags('素材管理')
@ApiBearerAuth()
@ApiCommonResponses()
@Controller('asset/folder')
export class AssetController {
  /** 创建当前实例。 */
  constructor(@Inject(AssetFolderService) private readonly folders: AssetFolderService) {}

  /** 查询当前操作者拥有的文件夹树。 */
  @Get('tree')
  @RequirePermission(PermissionCode.ASSET_FOLDER_READ)
  @ApiOperation({ summary: '查询我的素材文件夹树' })
  @ApiOkResponseData(AssetFolderTreeResponseDto)
  getTree(@CurrentAdmin() admin: AdminJwtPayload) {
    return this.folders.getTree(admin.sub, false);
  }

  /** 查询全部账号的文件夹树。 */
  @Get('tree/all')
  @RequirePermission(PermissionCode.ASSET_FOLDER_ALL)
  @ApiOperation({ summary: '查询全部素材文件夹树' })
  @ApiOkResponseData(AssetFolderTreeResponseDto)
  getAllTree(@CurrentAdmin() admin: AdminJwtPayload) {
    return this.folders.getTree(admin.sub, true);
  }

  /** 创建文件夹。 */
  @Post('create')
  @RequirePermission(PermissionCode.ASSET_FOLDER_CREATE)
  @ApiOperation({ summary: '创建素材文件夹' })
  @ApiBody({ type: CreateAssetFolderDto })
  @ApiOkResponseData(AssetFolderResponseDto)
  async create(@CurrentAdmin() admin: AdminJwtPayload, @Body() body: CreateAssetFolderDto) {
    return this.folders.create(admin.sub, body);
  }

  /** 重命名文件夹。 */
  @Post('update')
  @RequirePermission(PermissionCode.ASSET_FOLDER_UPDATE)
  @ApiOperation({ summary: '重命名素材文件夹' })
  @ApiBody({ type: UpdateAssetFolderDto })
  @ApiOkResponseData(AssetFolderResponseDto)
  async update(@CurrentAdmin() admin: AdminJwtPayload, @Body() body: UpdateAssetFolderDto) {
    return this.folders.update(admin.sub, body.id, body);
  }

  /** 软删除空文件夹。 */
  @Post('soft-delete')
  @RequirePermission(PermissionCode.ASSET_FOLDER_DELETE)
  @ApiOperation({ summary: '删除素材文件夹' })
  @ApiBody({ type: SoftDeleteAssetFolderDto })
  @ApiOkResponseEmpty()
  softDelete(@CurrentAdmin() admin: AdminJwtPayload, @Body() body: SoftDeleteAssetFolderDto) {
    return this.folders.softDelete(admin.sub, body.id);
  }
}
