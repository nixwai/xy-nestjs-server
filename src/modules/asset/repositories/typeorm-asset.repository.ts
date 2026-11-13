import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import { IsNull, Not } from 'typeorm';
import { DomainConflictError, DomainNotFoundError } from '#/common/errors/index.js';
import { getMysqlDuplicateKey } from '#/common/utils/index.js';
import { AssetFolderEntity } from '../entities/asset-folder.entity.js';
import type {
  AssetFolderCreateInput,
  AssetFolderQueryScope,
  AssetFolderRecord,
  AssetFolderUpdateInput
} from '../types/index.js';
import type { AssetFolderRepository } from './asset-repository.port.js';

/** 使用 MySQL 保存素材文件夹。 */
@Injectable()
export class TypeOrmAssetFolderRepository implements AssetFolderRepository {
  /** 创建当前实例。 */
  constructor(@InjectRepository(AssetFolderEntity) private readonly folders: Repository<AssetFolderEntity>) {}

  /** 按数据范围查询有效文件夹，按拥有者、父级和名称排列。 */
  async list(scope: AssetFolderQueryScope): Promise<AssetFolderRecord[]> {
    const query = this.folders
      .createQueryBuilder('folder')
      .orderBy('folder.ownerId', 'ASC')
      .addOrderBy('folder.parentId', 'ASC')
      .addOrderBy('folder.name', 'ASC')
      .addOrderBy('folder.id', 'ASC');
    if (scope.kind === 'owner') query.where('folder.ownerId = :ownerId', { ownerId: scope.ownerId });
    return (await query.getMany()).map(item => this.toRecord(item));
  }

  /** 按主键查询有效文件夹。 */
  async findById(id: string): Promise<AssetFolderRecord | null> {
    const item = await this.folders.findOne({ where: { id } });
    return item ? this.toRecord(item) : null;
  }

  /** 查询同一拥有者、同一父级下的同名文件夹，可排除自身。 */
  async findByName(
    ownerId: string,
    parentId: string | null,
    name: string,
    excludeId?: string
  ): Promise<AssetFolderRecord | null> {
    const item = await this.folders.findOne({
      where: {
        ownerId,
        parentId: parentId === null ? IsNull() : parentId,
        name,
        ...(excludeId ? { id: Not(excludeId) } : {})
      }
    });
    return item ? this.toRecord(item) : null;
  }

  /** 查询有效子文件夹。 */
  async listChildren(parentId: string): Promise<AssetFolderRecord[]> {
    return (await this.folders.find({ where: { parentId }, order: { name: 'ASC', id: 'ASC' } })).map(item =>
      this.toRecord(item)
    );
  }

  /** 保存新文件夹，同级重名命中唯一索引时转换为领域冲突。 */
  async create(input: AssetFolderCreateInput): Promise<AssetFolderRecord> {
    try {
      return this.toRecord(await this.folders.save(this.folders.create(input)));
    } catch (error: unknown) {
      this.rethrowConflict(error);
    }
  }

  /** 以新实体提交名称更新，保持查询得到的实体不被修改。 */
  async update(id: string, input: AssetFolderUpdateInput): Promise<AssetFolderRecord> {
    const item = await this.folders.findOne({ where: { id } });
    if (!item) throw new DomainNotFoundError('文件夹');
    const updated = this.folders.create({
      id: item.id,
      parentId: item.parentId,
      name: input.name,
      ownerId: item.ownerId,
      creatorId: item.creatorId,
      deletedAt: item.deletedAt,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt
    });
    try {
      return this.toRecord(await this.folders.save(updated));
    } catch (error: unknown) {
      this.rethrowConflict(error);
    }
  }

  /** 写入软删除时间。 */
  async softDelete(id: string): Promise<void> {
    const item = await this.folders.findOne({ where: { id } });
    if (!item) throw new DomainNotFoundError('文件夹');
    await this.folders.softRemove(item);
  }

  /** 把驱动返回的 bigint 主键统一为字符串，仅保留公开字段。 */
  private toRecord(item: AssetFolderEntity): AssetFolderRecord {
    return {
      id: String(item.id),
      name: item.name,
      parentId: item.parentId === null ? null : String(item.parentId),
      ownerId: String(item.ownerId),
      creatorId: String(item.creatorId),
      createdAt: item.createdAt,
      updatedAt: item.updatedAt
    };
  }

  /** 唯一索引冲突转换为领域冲突，其余异常保持原语义上抛。 */
  private rethrowConflict(error: unknown): never {
    if (getMysqlDuplicateKey(error)) throw new DomainConflictError('同级文件夹名称');
    throw error;
  }
}
