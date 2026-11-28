import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import { Not } from 'typeorm';
import { DomainNotFoundError } from '#/common/errors/index.js';
import type { PageQueryDto } from '#/common/dto/index.js';
import type { PageResult } from '#/common/types/index.js';
import { createPageResult } from '#/common/utils/index.js';
import { AssetImageEntity } from '../entities/asset-image.entity.js';
import type {
  AssetImageCreateInput,
  AssetImageUpdateInput,
  AssetImageFolderSearchQuery,
  AssetImageRecord
} from '../types/asset-image.types.js';
import type { AssetImageRepository } from './asset-image-repository.port.js';

/** 归一化分页参数，避免非法值参与偏移计算。 */
function toPageQuery(query: PageQueryDto): { page: number; pageSize: number; skip: number } {
  const page = Number(query.page) || 1;
  const pageSize = Number(query.pageSize) || 20;
  return { page, pageSize, skip: (page - 1) * pageSize };
}

/** 使用 TypeORM 保存素材图片。 */
@Injectable()
export class TypeOrmAssetImageRepository implements AssetImageRepository {
  /** 创建当前实例。 */
  constructor(@InjectRepository(AssetImageEntity) private readonly images: Repository<AssetImageEntity>) {}

  /** 按直属文件夹分页查询有效图片。 */
  async list(query: PageQueryDto & { folderId: string }): Promise<PageResult<AssetImageRecord>> {
    const pageQuery = toPageQuery(query);
    const builder = this.images
      .createQueryBuilder('image')
      .where('image.folderId = :folderId', { folderId: query.folderId })
      .orderBy('image.createdAt', 'DESC')
      .addOrderBy('image.id', 'DESC')
      .skip(pageQuery.skip)
      .take(pageQuery.pageSize);
    const [items, total] = await builder.getManyAndCount();
    return createPageResult(
      items.map(item => this.toRecord(item)),
      total,
      pageQuery
    );
  }

  /** 在指定文件夹集合内按图片原始文件名分页搜索，名称匹配不区分大小写。 */
  async search(query: AssetImageFolderSearchQuery): Promise<PageResult<AssetImageRecord>> {
    const pageQuery = toPageQuery(query);
    if (!query.folderIds.length) {
      return createPageResult([], 0, pageQuery);
    }

    const builder = this.images
      .createQueryBuilder('image')
      .where('image.folderId IN (:...folderIds)', { folderIds: query.folderIds })
      .andWhere('image.originalName LIKE :keyword', { keyword: `%${query.keyword}%` })
      .orderBy('image.createdAt', 'DESC')
      .addOrderBy('image.id', 'DESC')
      .skip(pageQuery.skip)
      .take(pageQuery.pageSize);
    const [items, total] = await builder.getManyAndCount();
    return createPageResult(
      items.map(item => this.toRecord(item)),
      total,
      pageQuery
    );
  }

  /** 按主键查询有效图片。 */
  async findById(id: string): Promise<AssetImageRecord | null> {
    const item = await this.images.findOne({ where: { id } });
    return item ? this.toRecord(item) : null;
  }

  /** 查询同一文件夹下的同名有效图片。 */
  async findByName(folderId: string, originalName: string, excludeId?: string): Promise<AssetImageRecord | null> {
    const item = await this.images.findOne({
      where: { folderId, originalName, ...(excludeId ? { id: Not(excludeId) } : {}) }
    });
    return item ? this.toRecord(item) : null;
  }

  /** 更新图片名称。 */
  async update(id: string, input: AssetImageUpdateInput): Promise<AssetImageRecord> {
    const item = await this.images.findOne({ where: { id } });
    if (!item) throw new DomainNotFoundError('素材图片');
    const updated = this.images.create({
      id: item.id,
      folderId: item.folderId,
      ownerId: item.ownerId,
      creatorId: item.creatorId,
      originalName: input.originalName,
      storageKey: item.storageKey,
      mimeType: item.mimeType,
      size: item.size,
      width: item.width,
      height: item.height,
      deletedAt: item.deletedAt,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt
    });
    return this.toRecord(await this.images.save(updated));
  }

  /** 软删除图片。 */
  async softDelete(id: string): Promise<void> {
    const item = await this.images.findOne({ where: { id } });
    if (!item) throw new DomainNotFoundError('素材图片');
    await this.images.softRemove(item);
  }

  /** 修改图片所属文件夹。 */
  async move(id: string, folderId: string, ownerId: string): Promise<AssetImageRecord> {
    const item = await this.images.findOne({ where: { id } });
    if (!item) throw new DomainNotFoundError('素材图片');
    const updated = this.images.create({
      id: item.id,
      folderId,
      ownerId,
      creatorId: item.creatorId,
      originalName: item.originalName,
      storageKey: item.storageKey,
      mimeType: item.mimeType,
      size: item.size,
      width: item.width,
      height: item.height,
      deletedAt: item.deletedAt,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt
    });
    return this.toRecord(await this.images.save(updated));
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
