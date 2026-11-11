import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import { In, IsNull, Not } from 'typeorm';
import { DomainConflictError, DomainNotFoundError } from '#/common/errors/index.js';
import { createPageResult } from '#/common/utils/index.js';
import type { PageResult } from '#/common/types/index.js';
import { AssetFolderEntity } from '../entities/asset-folder.entity.js';
import { AssetImageEntity } from '../entities/asset-image.entity.js';
import type {
  AssetFolderCreateInput,
  AssetFolderRecord,
  AssetFolderUpdateInput,
  AssetImageCreateInput,
  AssetImageQuery,
  AssetImageRecord,
  AssetQueryScope
} from '../types/asset.types.js';
import type { AssetFolderRepository, AssetImageRepository } from './asset-repository.port.js';

function rethrowUniqueConflict(error: unknown, resource: string): never {
  if (typeof error === 'object' && error !== null && 'driverError' in error) {
    const driverError = error.driverError;
    if (
      typeof driverError === 'object' &&
      driverError !== null &&
      'code' in driverError &&
      driverError.code === 'ER_DUP_ENTRY'
    ) {
      throw new DomainConflictError(resource);
    }
  }
  throw error;
}

@Injectable()
export class TypeOrmAssetFolderRepository implements AssetFolderRepository {
  constructor(
    @InjectRepository(AssetFolderEntity) private readonly folders: Repository<AssetFolderEntity>,
    @InjectRepository(AssetImageEntity) private readonly images: Repository<AssetImageEntity>
  ) {}
  async list(scope: AssetQueryScope): Promise<AssetFolderRecord[]> {
    const items = await this.folders.find({
      where: scope.kind === 'owner' ? { ownerId: scope.ownerId } : {},
      order: { createdAt: 'ASC', id: 'ASC' }
    });
    if (!items.length) return [];
    const counts = await this.images
      .createQueryBuilder('image')
      .select('image.folderId', 'folderId')
      .addSelect('COUNT(*)', 'imageCount')
      .where('image.folderId IN (:...ids)', { ids: items.map(item => item.id) })
      .groupBy('image.folderId')
      .getRawMany<{ folderId: string; imageCount: string }>();
    const byFolder = new Map(counts.map(item => [String(item.folderId), Number(item.imageCount)]));
    return items.map(item => ({ ...this.toRecord(item), imageCount: byFolder.get(String(item.id)) ?? 0 }));
  }
  async lockOwner(ownerId: string, requireActive = false): Promise<void> {
    if (!this.folders.manager.queryRunner?.isTransactionActive) throw new Error('lockOwner 必须在素材事务中调用');
    const rows: { id: string; is_active: number | boolean }[] = await this.folders.manager.query(
      'SELECT `id`, `is_active` FROM `admin` WHERE `id` = ? AND `deleted_at` IS NULL FOR UPDATE',
      [ownerId]
    );
    if (!rows.length) throw new DomainNotFoundError('归属管理员');
    if (requireActive && Number(rows[0]?.is_active) !== 1) throw new ForbiddenException('归属管理员已停用');
  }
  async listOwnerIds(): Promise<string[]> {
    const items = await this.folders
      .createQueryBuilder('folder')
      .select('folder.ownerId', 'ownerId')
      .distinct(true)
      .getRawMany<{ ownerId: string }>();
    return items.map(item => String(item.ownerId));
  }
  async findById(id: string): Promise<AssetFolderRecord | null> {
    const item = await this.folders.findOne({ where: { id } });
    return item ? this.toRecord(item) : null;
  }
  async findByName(
    ownerId: string,
    parentId: string | null,
    name: string,
    excludeId?: string
  ): Promise<AssetFolderRecord | null> {
    const item = await this.folders.findOne({
      where: { ownerId, parentId: parentId ?? IsNull(), name, ...(excludeId ? { id: Not(excludeId) } : {}) }
    });
    return item ? this.toRecord(item) : null;
  }
  async listDescendants(id: string): Promise<AssetFolderRecord[]> {
    const root = await this.findById(id);
    if (!root) return [];
    const result = [root];
    const visited = new Set([id]);
    let pending = [id];
    while (pending.length) {
      const children = await this.folders.find({ where: { ownerId: root.ownerId, parentId: In(pending) } });
      const next = children.filter(child => !visited.has(String(child.id)));
      pending = next.map(child => String(child.id));
      for (const child of next) {
        visited.add(String(child.id));
        result.push(this.toRecord(child));
      }
    }
    return result;
  }
  async create(input: AssetFolderCreateInput): Promise<AssetFolderRecord> {
    if (await this.findByName(input.ownerId, input.parentId, input.name))
      throw new DomainConflictError('同级文件夹名称');
    try {
      return this.toRecord(await this.folders.save(this.folders.create(input)));
    } catch (error) {
      return rethrowUniqueConflict(error, '同级文件夹名称');
    }
  }
  async update(id: string, input: AssetFolderUpdateInput): Promise<AssetFolderRecord> {
    const item = await this.folders.findOne({ where: { id } });
    if (!item) throw new DomainNotFoundError('素材文件夹');
    const next = this.folders.create({ ...this.toRecord(item), ...input });
    if (await this.findByName(next.ownerId, next.parentId, next.name, id))
      throw new DomainConflictError('同级文件夹名称');
    try {
      return this.toRecord(await this.folders.save(next));
    } catch (error) {
      return rethrowUniqueConflict(error, '同级文件夹名称');
    }
  }
  async softDelete(id: string): Promise<void> {
    if (!(await this.findById(id))) throw new DomainNotFoundError('素材文件夹');
    await this.softDeleteMany([id]);
  }
  async softDeleteMany(ids: string[]): Promise<void> {
    if (ids.length) await this.folders.softDelete({ id: In(ids) });
  }
  private toRecord(item: AssetFolderEntity): AssetFolderRecord {
    return {
      id: String(item.id),
      name: item.name,
      parentId: item.parentId === null ? null : String(item.parentId),
      ownerId: String(item.ownerId),
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
  async list(query: AssetImageQuery): Promise<PageResult<AssetImageRecord>> {
    const qb = this.images.createQueryBuilder('image');
    if (query.scope.kind === 'owner') qb.andWhere('image.ownerId = :ownerId', { ownerId: query.scope.ownerId });
    if (query.unclassified) qb.andWhere('image.folderId IS NULL');
    else if (query.folderId) qb.andWhere('image.folderId = :folderId', { folderId: query.folderId });
    if (query.keyword)
      qb.andWhere("image.originalName LIKE :keyword ESCAPE '!'", {
        keyword: `%${query.keyword.replace(/[!%_]/g, '!$&')}%`
      });
    const [items, total] = await qb
      .orderBy('image.createdAt', 'DESC')
      .addOrderBy('image.id', 'DESC')
      .skip(query.skip)
      .take(query.pageSize)
      .getManyAndCount();
    return createPageResult(
      items.map(item => this.toRecord(item)),
      total,
      query
    );
  }
  async listOwnerIds(): Promise<string[]> {
    const items = await this.images
      .createQueryBuilder('image')
      .select('image.ownerId', 'ownerId')
      .distinct(true)
      .getRawMany<{ ownerId: string }>();
    return items.map(item => String(item.ownerId));
  }
  async create(input: AssetImageCreateInput): Promise<AssetImageRecord> {
    try {
      return this.toRecord(await this.images.save(this.images.create(input)));
    } catch (error) {
      return rethrowUniqueConflict(error, '素材存储键');
    }
  }
  async findById(id: string): Promise<AssetImageRecord | null> {
    const item = await this.images.findOne({ where: { id } });
    return item ? this.toRecord(item) : null;
  }
  async updateFolder(id: string, folderId: string | null): Promise<AssetImageRecord> {
    const item = await this.images.findOne({ where: { id } });
    if (!item) throw new DomainNotFoundError('素材图片');
    return this.toRecord(await this.images.save(this.images.create({ ...this.toRecord(item), folderId })));
  }
  async softDelete(id: string): Promise<void> {
    if (!(await this.findById(id))) throw new DomainNotFoundError('素材图片');
    await this.images.softDelete(id);
  }
  async moveToRoot(folderId: string): Promise<void> {
    await this.moveFoldersToRoot([folderId]);
  }
  async moveFoldersToRoot(ids: string[]): Promise<void> {
    if (ids.length) await this.images.update({ folderId: In(ids), deletedAt: IsNull() }, { folderId: null });
  }
  private toRecord(item: AssetImageEntity): AssetImageRecord {
    return {
      id: String(item.id),
      folderId: item.folderId === null ? null : String(item.folderId),
      originalName: item.originalName,
      url: item.url,
      storageKey: item.storageKey,
      mimeType: item.mimeType,
      size: Number(item.size),
      width: item.width,
      height: item.height,
      ownerId: String(item.ownerId),
      createdByAdminId: String(item.createdByAdminId),
      createdAt: item.createdAt,
      updatedAt: item.updatedAt
    };
  }
}
