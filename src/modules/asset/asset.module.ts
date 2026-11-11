import { Module } from '@nestjs/common';
import { AdminModule } from '../admin/admin.module.js';
import { AuthorizationModule } from '../authorization/authorization.module.js';
import { UploadModule } from '../upload/upload.module.js';
import { AssetController } from './asset.controller.js';
import { AssetService } from './asset.service.js';
import { AssetAccessPolicy } from './asset-access.policy.js';
import { AssetFolderService } from './asset-folder.service.js';
import { AssetImageService } from './asset-image.service.js';

@Module({
  imports: [AdminModule, AuthorizationModule, UploadModule],
  controllers: [AssetController],
  providers: [AssetService, AssetAccessPolicy, AssetFolderService, AssetImageService]
})
export class AssetModule {}
