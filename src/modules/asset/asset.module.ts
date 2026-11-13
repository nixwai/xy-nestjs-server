import { Module } from '@nestjs/common';
import { AdminModule } from '../admin/admin.module.js';
import { AuthorizationModule } from '../authorization/authorization.module.js';
import { AssetController } from './asset.controller.js';
import { AssetFolderService } from './asset-folder.service.js';

/** 提供素材文件夹管理能力。 */
@Module({
  imports: [AdminModule, AuthorizationModule],
  controllers: [AssetController],
  providers: [AssetFolderService],
  exports: [AssetFolderService]
})
export class AssetModule {}
