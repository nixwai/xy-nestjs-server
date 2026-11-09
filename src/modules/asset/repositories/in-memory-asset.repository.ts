import { DomainNotFoundError } from '#/common/errors/index.js';
import { createPageResult } from '#/common/utils/index.js';
import type { PageResult } from '#/common/types/index.js';
import type {
  AssetFolderCreateInput,
  AssetFolderRecord,
  AssetFolderUpdateInput,
  AssetImageCreateInput,
  AssetImageQuery,
  AssetImageRecord
} from '../types/asset.types.js';
import type { AssetFolderRepository, AssetImageRepository } from './asset-repository.port.js';
export class InMemoryAssetFolderRepository implements AssetFolderRepository {
  private readonly items = new Map<string, AssetFolderRecord>();
  private nextId = 1;
  async list(ownerId?: string) {
    return [...this.items.values()].filter(x => !ownerId || x.createdByAdminId === ownerId).map(x => ({ ...x }));
  }
  async findById(id: string) {
    const x = this.items.get(id);
    return x ? { ...x } : null;
  }
  async create(input: AssetFolderCreateInput) {
    const now = new Date();
    const x = { ...input, id: String(this.nextId++), imageCount: 0, createdAt: now, updatedAt: now };
    this.items.set(x.id, x);
    return { ...x };
  }
  async update(id: string, input: AssetFolderUpdateInput) {
    const x = await this.findById(id);
    if (!x) throw new DomainNotFoundError('素材文件夹');
    const next = { ...x, ...input, updatedAt: new Date() };
    this.items.set(id, next);
    return { ...next };
  }
  async softDelete(id: string) {
    if (!this.items.delete(id)) throw new DomainNotFoundError('素材文件夹');
  }
}
export class InMemoryAssetImageRepository implements AssetImageRepository {
  private readonly items = new Map<string, AssetImageRecord>();
  private nextId = 1;
  async list(query: AssetImageQuery): Promise<PageResult<AssetImageRecord>> {
    const filtered = [...this.items.values()]
      .filter(
        x =>
          (!query.folderId || x.folderId === query.folderId) &&
          (!query.createdByAdminId || x.createdByAdminId === query.createdByAdminId) &&
          (!query.keyword || x.originalName.includes(query.keyword))
      )
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return createPageResult(filtered.slice(query.skip, query.skip + query.pageSize), filtered.length, query);
  }
  async create(input: AssetImageCreateInput) {
    const now = new Date();
    const x = { ...input, id: String(this.nextId++), createdAt: now, updatedAt: now };
    this.items.set(x.id, x);
    return { ...x };
  }
  async findById(id: string) {
    const x = this.items.get(id);
    return x ? { ...x } : null;
  }
  async updateFolder(id: string, folderId: string | null) {
    const x = await this.findById(id);
    if (!x) throw new DomainNotFoundError('素材图片');
    const next = { ...x, folderId, updatedAt: new Date() };
    this.items.set(id, next);
    return { ...next };
  }
  async softDelete(id: string) {
    if (!this.items.delete(id)) throw new DomainNotFoundError('素材图片');
  }
  async moveToRoot(folderId: string) {
    for (const [id, x] of this.items)
      if (x.folderId === folderId) this.items.set(id, { ...x, folderId: null, updatedAt: new Date() });
  }
}
