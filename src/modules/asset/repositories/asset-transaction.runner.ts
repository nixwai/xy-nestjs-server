import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import type { DataSource } from 'typeorm';
import { AssetFolderEntity } from '../entities/asset-folder.entity.js';
import { AssetImageEntity } from '../entities/asset-image.entity.js';
import type { AssetTransactionRepositories, AssetTransactionRunner } from './asset-repository.port.js';
import { TypeOrmAssetFolderRepository, TypeOrmAssetImageRepository } from './asset.repository.js';

@Injectable()
export class TypeOrmAssetTransactionRunner implements AssetTransactionRunner {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}
  async run<T>(callback: (repositories: AssetTransactionRepositories) => Promise<T>): Promise<T> {
    return this.dataSource.transaction(async manager => {
      const images = manager.getRepository(AssetImageEntity);
      return callback({
        folders: new TypeOrmAssetFolderRepository(manager.getRepository(AssetFolderEntity), images),
        images: new TypeOrmAssetImageRepository(images)
      });
    });
  }
}
