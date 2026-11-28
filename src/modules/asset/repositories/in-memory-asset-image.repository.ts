import { Injectable } from '@nestjs/common';
import type { PageQueryDto } from '#/common/dto/index.js';
import { DomainNotFoundError } from '#/common/errors/index.js';
import type { PageResult } from '#/common/types/index.js';
import type {
  AssetImageCreateInput,
  AssetImageUpdateInput,
  AssetImageFolderSearchQuery,
  AssetImageRecord
} from '../types/asset-image.types.js';
import type { AssetImageRepository } from './asset-image-repository.port.js';

/** 归一化分页参数，与数据库实现保持一致。 */
function toPageQuery(query: PageQueryDto): { page: number; pageSize: number } {
  return { page: Number(query.page) || 1, pageSize: Number(query.pageSize) || 20 };
}

/** 单元测试和无数据库运行时使用的素材图片仓储。 */
@Injectable()
export class InMemoryAssetImageRepository implements AssetImageRepository {
  private readonly items = new Map<string, AssetImageRecord>();
  private nextId = 1;
  private readonly deletedIds = new Set<string>();

  /** 按直属文件夹分页查询有效图片。 */
  async list(query: PageQueryDto & { folderId: string }): Promise<PageResult<AssetImageRecord>> {
    const { page, pageSize } = toPageQuery(query);
    return this.toPageResult(
      this.activeItems().filter(item => item.folderId === query.folderId),
      page,
      pageSize
    );
  }

  /** 在指定文件夹集合内按图片原始文件名分页搜索，名称匹配不区分大小写。 */
  async search(query: AssetImageFolderSearchQuery): Promise<PageResult<AssetImageRecord>> {
    const { page, pageSize } = toPageQuery(query);
    const folderIds = new Set(query.folderIds);
    const keyword = query.keyword.toLocaleLowerCase();
    return this.toPageResult(
      this.activeItems().filter(
        item => folderIds.has(item.folderId) && item.originalName.toLocaleLowerCase().includes(keyword)
      ),
      page,
      pageSize
    );
  }

  /** 按主键查询有效图片。 */
  async findById(id: string): Promise<AssetImageRecord | null> {
    const item = this.items.get(id);
    return item && !this.deletedIds.has(id) ? { ...item } : null;
  }

  /** 查询同一文件夹下的同名有效图片。 */
  async findByName(folderId: string, originalName: string, excludeId?: string): Promise<AssetImageRecord | null> {
    const item = this.activeItems().find(
      candidate =>
        candidate.folderId === folderId && candidate.originalName === originalName && candidate.id !== excludeId
    );
    return item ? { ...item } : null;
  }

  /** 更新图片名称。 */
  async update(id: string, input: AssetImageUpdateInput): Promise<AssetImageRecord> {
    const item = await this.findById(id);
    if (!item) throw new DomainNotFoundError('素材图片');
    const updated = { ...item, ...input, updatedAt: new Date() };
    this.items.set(id, updated);
    return { ...updated };
  }

  /** 软删除图片。 */
  async softDelete(id: string): Promise<void> {
    if (!(await this.findById(id))) throw new DomainNotFoundError('素材图片');
    this.deletedIds.add(id);
  }

  /** 修改图片所属文件夹。 */
  async move(id: string, folderId: string, ownerId: string): Promise<AssetImageRecord> {
    const item = await this.findById(id);
    if (!item) throw new DomainNotFoundError('素材图片');
    const updated = { ...item, folderId, ownerId, updatedAt: new Date() };
    this.items.set(id, updated);
    return { ...updated };
  }

  /** 返回未被软删除的图片记录。 */
  private activeItems(): AssetImageRecord[] {
    return [...this.items.values()].filter(item => !this.deletedIds.has(item.id));
  }

  /** 统计直属文件夹中的有效图片数量。 */
  async countByFolderId(folderId: string): Promise<number> {
    return this.activeItems().filter(item => item.folderId === folderId).length;
  }

  /** 创建素材图片记录。 */
  async create(input: AssetImageCreateInput): Promise<AssetImageRecord> {
    const now = new Date();
    const item: AssetImageRecord = { id: String(this.nextId++), ...input, createdAt: now, updatedAt: now };
    this.items.set(item.id, item);
    return { ...item };
  }

  /** 按创建时间和主键倒序后构造分页结果。 */
  private toPageResult(
    items: readonly AssetImageRecord[],
    page: number,
    pageSize: number
  ): PageResult<AssetImageRecord> {
    const sorted = [...items].sort(
      (left, right) => right.createdAt.getTime() - left.createdAt.getTime() || this.compareId(right.id, left.id)
    );
    const total = sorted.length;
    const totalPages = total === 0 ? 0 : Math.ceil(total / pageSize);
    return {
      items: sorted.slice((page - 1) * pageSize, page * pageSize).map(item => ({ ...item })),
      total,
      page,
      pageSize,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1 && total > 0
    };
  }

  /** 按数值比较主键，避免字符串比较造成顺序错误。 */
  private compareId(left: string, right: string): number {
    return Number(BigInt(left) - BigInt(right));
  }
}
