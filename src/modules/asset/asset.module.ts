import { Module } from '@nestjs/common';
import { AdminModule } from '../admin/admin.module.js';
import { UploadModule } from '../upload/upload.module.js';
import { AuthorizationModule } from '../authorization/authorization.module.js';
import { ResourceUrlModule } from '#/common/services/index.js';
import { AssetController } from './asset.controller.js';
import { AssetFolderService } from './asset-folder.service.js';
import { AssetImageController } from './asset-image.controller.js';
import { AssetImageService } from './asset-image.service.js';

/** 提供素材文件夹管理能力。 */
@Module({
  imports: [AdminModule, AuthorizationModule, UploadModule, ResourceUrlModule],
  controllers: [AssetController, AssetImageController],
  providers: [AssetFolderService, AssetImageService],
  exports: [AssetFolderService, AssetImageService]
})
export class AssetModule {}
