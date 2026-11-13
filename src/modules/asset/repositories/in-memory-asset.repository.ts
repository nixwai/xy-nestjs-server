import { Injectable } from '@nestjs/common';
import { DomainConflictError, DomainNotFoundError } from '#/common/errors/index.js';
import type {
  AssetFolderCreateInput,
  AssetFolderQueryScope,
  AssetFolderRecord,
  AssetFolderUpdateInput
} from '../types/index.js';
import type { AssetFolderRepository } from './asset-repository.port.js';

/** 单元测试和无数据库运行时使用的素材文件夹仓储。 */
@Injectable()
export class InMemoryAssetFolderRepository implements AssetFolderRepository {
  private items = new Map<string, AssetFolderRecord>();
  private deletedIds = new Set<string>();
  private nextId = 1;

  /** 按数据范围查询有效文件夹，排序与数据库实现一致。 */
  async list(scope: AssetFolderQueryScope): Promise<AssetFolderRecord[]> {
    return this.activeItems()
      .filter(item => scope.kind === 'all' || item.ownerId === scope.ownerId)
      .sort((left, right) => {
        const ownerOrder = this.compareId(left.ownerId, right.ownerId);
        if (ownerOrder !== 0) return ownerOrder;
        // 顶层文件夹的父级视作 0，与数据库的 NULL 排序位置保持一致。
        const parentOrder = this.compareId(left.parentId ?? '0', right.parentId ?? '0');
        return parentOrder || left.name.localeCompare(right.name) || this.compareId(left.id, right.id);
      })
      .map(item => ({ ...item }));
  }

  /** 按主键查询有效文件夹。 */
  async findById(id: string): Promise<AssetFolderRecord | null> {
    const item = this.items.get(id);
    return item && !this.deletedIds.has(id) ? { ...item } : null;
  }

  /** 查询同一拥有者、同一父级下的同名文件夹，可排除自身。 */
  async findByName(
    ownerId: string,
    parentId: string | null,
    name: string,
    excludeId?: string
  ): Promise<AssetFolderRecord | null> {
    const item = this.activeItems().find(
      candidate =>
        candidate.id !== excludeId &&
        candidate.ownerId === ownerId &&
        candidate.parentId === parentId &&
        candidate.name === name
    );
    return item ? { ...item } : null;
  }

  /** 查询有效子文件夹。 */
  async listChildren(parentId: string): Promise<AssetFolderRecord[]> {
    return this.activeItems()
      .filter(item => item.parentId === parentId)
      .map(item => ({ ...item }));
  }

  /** 保存新文件夹，同级重名直接按冲突处理。 */
  async create(input: AssetFolderCreateInput): Promise<AssetFolderRecord> {
    if (await this.findByName(input.ownerId, input.parentId, input.name)) {
      throw new DomainConflictError('同级文件夹名称');
    }
    const now = new Date();
    const item: AssetFolderRecord = {
      id: String(this.nextId++),
      ...input,
      createdAt: now,
      updatedAt: now
    };
    this.items.set(item.id, item);
    return { ...item };
  }

  /** 更新名称并刷新更新时间，同级重名按冲突处理。 */
  async update(id: string, input: AssetFolderUpdateInput): Promise<AssetFolderRecord> {
    const item = await this.findById(id);
    if (!item) throw new DomainNotFoundError('文件夹');
    if (await this.findByName(item.ownerId, item.parentId, input.name, id)) {
      throw new DomainConflictError('同级文件夹名称');
    }
    const updated = { ...item, ...input, updatedAt: new Date() };
    this.items.set(id, updated);
    return { ...updated };
  }

  /** 标记文件夹为已删除，记录保留以便同级名称重新可用。 */
  async softDelete(id: string): Promise<void> {
    if (!this.items.has(id) || this.deletedIds.has(id)) throw new DomainNotFoundError('文件夹');
    this.deletedIds.add(id);
  }

  /** 未被软删除的全部记录。 */
  private activeItems(): AssetFolderRecord[] {
    return [...this.items.values()].filter(item => !this.deletedIds.has(item.id));
  }

  /** 按数值比较主键，避免字符串比较导致顺序与数据库不一致。 */
  private compareId(left: string, right: string): number {
    return Number(BigInt(left) - BigInt(right));
  }
}
