import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import type { PageResult } from '#/common/types/index.js';
import { AssetImageEntity } from '../entities/asset-image.entity.js';
import type { AssetImageCreateInput, AssetImageRecord } from '../types/asset-image.types.js';
import type { AssetImageRepository } from './asset-image-repository.port.js';

/** 使用 TypeORM 保存素材图片。 */
@Injectable()
export class TypeOrmAssetImageRepository implements AssetImageRepository {
  /** 创建当前实例。 */
  constructor(@InjectRepository(AssetImageEntity) private readonly images: Repository<AssetImageEntity>) {}

  /** 按直属文件夹分页查询有效图片。 */
  async list(query: {
    folderId: string;
    page: number;
    pageSize: number;
    skip: number;
  }): Promise<PageResult<AssetImageRecord>> {
    const page = Number(query.page) || 1;
    const pageSize = Number(query.pageSize) || 20;
    const builder = this.images
      .createQueryBuilder('image')
      .where('image.folderId = :folderId', { folderId: query.folderId })
      .orderBy('image.createdAt', 'DESC')
      .addOrderBy('image.id', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize);
    const [items, total] = await builder.getManyAndCount();
    const totalPages = total === 0 ? 0 : Math.ceil(total / pageSize);
    return {
      items: items.map(item => this.toRecord(item)),
      total,
      page,
      pageSize,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1 && total > 0
    };
  }

  /** 统计直属文件夹中的有效图片数量。 */
  countByFolderId(folderId: string): Promise<number> {
    return this.images.count({ where: { folderId } });
  }

  /** 创建素材图片记录。 */
  async create(input: AssetImageCreateInput): Promise<AssetImageRecord> {
    return this.toRecord(await this.images.save(this.images.create(input)));
  }

  /** 将数据库实体转换为领域记录。 */
  private toRecord(item: AssetImageEntity): AssetImageRecord {
    return {
      id: String(item.id),
      folderId: String(item.folderId),
      ownerId: String(item.ownerId),
      creatorId: String(item.creatorId),
      originalName: item.originalName,
      storageKey: item.storageKey,
      mimeType: item.mimeType,
      size: item.size,
      width: item.width,
      height: item.height,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt
    };
  }
}
