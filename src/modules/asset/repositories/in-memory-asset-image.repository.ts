import { Injectable } from '@nestjs/common';
import type { PageResult } from '#/common/types/index.js';
import type { AssetImageCreateInput, AssetImageRecord } from '../types/asset-image.types.js';
import type { AssetImageRepository } from './asset-image-repository.port.js';

/** 单元测试和无数据库运行时使用的素材图片仓储。 */
@Injectable()
export class InMemoryAssetImageRepository implements AssetImageRepository {
  private readonly items = new Map<string, AssetImageRecord>();
  private nextId = 1;

  /** 按直属文件夹分页查询有效图片。 */
  async list(query: {
    folderId: string;
    page: number;
    pageSize: number;
    skip: number;
  }): Promise<PageResult<AssetImageRecord>> {
    const items = [...this.items.values()]
      .filter(item => item.folderId === query.folderId)
      .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime() || this.compareId(right.id, left.id));
    const total = items.length;
    const page = Number(query.page) || 1;
    const pageSize = Number(query.pageSize) || 20;
    const pageItems = items.slice((page - 1) * pageSize, page * pageSize);
    const totalPages = total === 0 ? 0 : Math.ceil(total / pageSize);
    return {
      items: pageItems.map(item => ({ ...item })),
      total,
      page,
      pageSize,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1 && total > 0
    };
  }

  /** 统计直属文件夹中的有效图片数量。 */
  async countByFolderId(folderId: string): Promise<number> {
    return [...this.items.values()].filter(item => item.folderId === folderId).length;
  }

  /** 创建素材图片记录。 */
  async create(input: AssetImageCreateInput): Promise<AssetImageRecord> {
    const now = new Date();
    const item: AssetImageRecord = { id: String(this.nextId++), ...input, createdAt: now, updatedAt: now };
    this.items.set(item.id, item);
    return { ...item };
  }

  /** 按数值比较主键，避免字符串比较造成顺序错误。 */
  private compareId(left: string, right: string): number {
    return Number(BigInt(left) - BigInt(right));
  }
}
