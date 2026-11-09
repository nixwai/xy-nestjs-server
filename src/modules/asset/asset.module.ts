import { Module } from '@nestjs/common';
import { AuthorizationModule } from '../authorization/authorization.module.js';
import { UploadModule } from '../upload/upload.module.js';
import { AssetController } from './asset.controller.js';
import { AssetService } from './asset.service.js';

@Module({ imports: [AuthorizationModule, UploadModule], controllers: [AssetController], providers: [AssetService] })
export class AssetModule {}
