import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import { Like } from 'typeorm';
import { DomainNotFoundError } from '#/common/errors/index.js';
import { createPageResult } from '#/common/utils/index.js';
import { AssetFolderEntity } from '../entities/asset-folder.entity.js';
import { AssetImageEntity } from '../entities/asset-image.entity.js';
import type {
  AssetFolderCreateInput,
  AssetFolderRecord,
  AssetFolderUpdateInput,
  AssetImageCreateInput,
  AssetImageQuery,
  AssetImageRecord
} from '../types/asset.types.js';
import type { AssetFolderRepository, AssetImageRepository } from './asset-repository.port.js';

@Injectable()
export class TypeOrmAssetFolderRepository implements AssetFolderRepository {
  constructor(
    @InjectRepository(AssetFolderEntity) private readonly folders: Repository<AssetFolderEntity>,
    @InjectRepository(AssetImageEntity) private readonly images: Repository<AssetImageEntity>
  ) {}
  async list(ownerId?: string): Promise<AssetFolderRecord[]> {
    const items = await this.folders.find({
      where: ownerId ? { createdByAdminId: ownerId } : undefined,
      order: { createdAt: 'ASC', id: 'ASC' }
    });
    const counts = await Promise.all(items.map(item => this.images.count({ where: { folderId: item.id } })));
    return items.map((item, i) => ({ ...this.toRecord(item), imageCount: counts[i] ?? 0 }));
  }
  async findById(id: string): Promise<AssetFolderRecord | null> {
    const item = await this.folders.findOne({ where: { id } });
    return item ? { ...this.toRecord(item), imageCount: await this.images.count({ where: { folderId: id } }) } : null;
  }
  async create(input: AssetFolderCreateInput): Promise<AssetFolderRecord> {
    return { ...this.toRecord(await this.folders.save(this.folders.create(input))), imageCount: 0 };
  }
  async update(id: string, input: AssetFolderUpdateInput): Promise<AssetFolderRecord> {
    const item = await this.folders.findOne({ where: { id } });
    if (!item) throw new DomainNotFoundError('素材文件夹');
    this.folders.merge(item, input);
    return {
      ...this.toRecord(await this.folders.save(item)),
      imageCount: await this.images.count({ where: { folderId: id } })
    };
  }
  async softDelete(id: string): Promise<void> {
    const item = await this.folders.findOne({ where: { id } });
    if (!item) throw new DomainNotFoundError('素材文件夹');
    await this.folders.softRemove(item);
  }
  private toRecord(item: AssetFolderEntity): AssetFolderRecord {
    return {
      id: String(item.id),
      name: item.name,
      parentId: item.parentId ? String(item.parentId) : null,
      createdByAdminId: String(item.createdByAdminId),
      imageCount: 0,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt
    };
  }
}
@Injectable()
export class TypeOrmAssetImageRepository implements AssetImageRepository {
  constructor(@InjectRepository(AssetImageEntity) private readonly images: Repository<AssetImageEntity>) {}
  async list(query: AssetImageQuery): Promise<import('#/common/types/index.js').PageResult<AssetImageRecord>> {
    const where = {
      ...(query.folderId ? { folderId: query.folderId } : {}),
      ...(query.createdByAdminId ? { createdByAdminId: query.createdByAdminId } : {}),
      ...(query.keyword ? { originalName: Like(`%${query.keyword}%`) } : {})
    };
    const [items, total] = await this.images.findAndCount({
      where,
      order: { createdAt: 'DESC', id: 'DESC' },
      skip: query.skip,
      take: query.pageSize
    });
    return createPageResult(
      items.map(item => this.toRecord(item)),
      total,
      query
    );
  }
  async create(input: AssetImageCreateInput): Promise<AssetImageRecord> {
    return this.toRecord(await this.images.save(this.images.create(input as Partial<AssetImageEntity>)));
  }
  async findById(id: string): Promise<AssetImageRecord | null> {
    const item = await this.images.findOne({ where: { id } });
    return item ? this.toRecord(item) : null;
  }
  async updateFolder(id: string, folderId: string | null): Promise<AssetImageRecord> {
    const item = await this.images.findOne({ where: { id } });
    if (!item) throw new DomainNotFoundError('素材图片');
    item.folderId = folderId;
    return this.toRecord(await this.images.save(item));
  }
  async softDelete(id: string): Promise<void> {
    const item = await this.images.findOne({ where: { id } });
    if (!item) throw new DomainNotFoundError('素材图片');
    await this.images.softRemove(item);
  }
  async moveToRoot(folderId: string): Promise<void> {
    await this.images.update({ folderId }, { folderId: null });
  }
  private toRecord(item: AssetImageEntity): AssetImageRecord {
    return {
      id: String(item.id),
      folderId: item.folderId ? String(item.folderId) : null,
      originalName: item.originalName,
      url: item.url,
      storageKey: item.storageKey,
      mimeType: item.mimeType,
      size: Number(item.size),
      width: item.width,
      height: item.height,
      createdByAdminId: String(item.createdByAdminId),
      createdAt: item.createdAt,
      updatedAt: item.updatedAt
    };
  }
}
