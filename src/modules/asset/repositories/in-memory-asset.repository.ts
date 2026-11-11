import { ForbiddenException, Inject, Injectable, Optional } from '@nestjs/common';
import { DomainConflictError, DomainNotFoundError } from '#/common/errors/index.js';
import { createPageResult } from '#/common/utils/index.js';
import type { PageResult } from '#/common/types/index.js';
import type {
  AssetFolderCreateInput,
  AssetFolderRecord,
  AssetFolderUpdateInput,
  AssetImageCreateInput,
  AssetImageQuery,
  AssetImageRecord,
  AssetQueryScope
} from '../types/asset.types.js';
import { ADMIN_REPOSITORY } from '../../admin/repositories/admin-repository.port.js';
import type { AdminRepository } from '../../admin/repositories/admin-repository.port.js';
import { ASSET_FOLDER_REPOSITORY, ASSET_IMAGE_REPOSITORY } from './asset-repository.port.js';
import type {
  AssetFolderRepository,
  AssetImageRepository,
  AssetTransactionRepositories,
  AssetTransactionRunner
} from './asset-repository.port.js';

type StoredRecord<T> = T & { deletedAt: Date | null };

function activeRecord<T>(item: StoredRecord<T> | undefined): T | null {
  if (!item || item.deletedAt !== null) return null;
  const { deletedAt: _deletedAt, ...record } = item;
  return copy(record as T);
}

function copy<T>(value: T): T {
  return structuredClone(value);
}
function inScope(record: { ownerId: string }, scope: AssetQueryScope) {
  return scope.kind === 'all' || record.ownerId === scope.ownerId;
}

@Injectable()
export class InMemoryAssetImageRepository implements AssetImageRepository {
  private items = new Map<string, StoredRecord<AssetImageRecord>>();
  private activeItems(): AssetImageRecord[] {
    return [...this.items.values()].flatMap(item => {
      const record = activeRecord<AssetImageRecord>(item);
      return record ? [record] : [];
    });
  }
  private nextId = 1;
  async list(query: AssetImageQuery): Promise<PageResult<AssetImageRecord>> {
    const filtered = this.activeItems()
      .filter(
        x =>
          inScope(x, query.scope) &&
          (query.unclassified ? x.folderId === null : !query.folderId || x.folderId === query.folderId) &&
          (!query.keyword || x.originalName.includes(query.keyword))
      )
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime() || Number(BigInt(b.id) - BigInt(a.id)));
    return createPageResult(copy(filtered.slice(query.skip, query.skip + query.pageSize)), filtered.length, query);
  }
  async listOwnerIds(): Promise<string[]> {
    return [...new Set(this.activeItems().map(x => x.ownerId))];
  }
  countByFolder(): Map<string, number> {
    const counts = new Map<string, number>();
    for (const item of this.activeItems())
      if (item.folderId) counts.set(item.folderId, (counts.get(item.folderId) ?? 0) + 1);
    return counts;
  }
  async create(input: AssetImageCreateInput): Promise<AssetImageRecord> {
    if ([...this.items.values()].some(item => item.storageKey === input.storageKey)) {
      throw new DomainConflictError('素材存储键');
    }
    const now = new Date();
    const item = { ...input, id: String(this.nextId++), createdAt: now, updatedAt: now };
    this.items = new Map([...this.items, [item.id, { ...copy(item), deletedAt: null }]]);
    return copy(item);
  }
  async findById(id: string): Promise<AssetImageRecord | null> {
    return activeRecord(this.items.get(id));
  }
  async updateFolder(id: string, folderId: string | null): Promise<AssetImageRecord> {
    const item = await this.findById(id);
    if (!item) throw new DomainNotFoundError('素材图片');
    const next = { ...item, folderId, updatedAt: new Date() };
    this.items = new Map([...this.items, [id, { ...copy(next), deletedAt: null }]]);
    return copy(next);
  }
  async softDelete(id: string): Promise<void> {
    const item = await this.findById(id);
    if (!item) throw new DomainNotFoundError('素材图片');
    const now = new Date();
    this.items = new Map([...this.items, [id, { ...item, deletedAt: now, updatedAt: now }]]);
  }
  async moveToRoot(folderId: string): Promise<void> {
    await this.moveFoldersToRoot([folderId]);
  }
  async moveFoldersToRoot(ids: string[]): Promise<void> {
    const selected = new Set(ids);
    this.items = new Map(
      [...this.items].map(([id, item]) => [
        id,
        item.deletedAt === null && item.folderId && selected.has(item.folderId)
          ? { ...item, folderId: null, updatedAt: new Date() }
          : item
      ])
    );
  }
  fork(): InMemoryAssetImageRepository {
    const next = new InMemoryAssetImageRepository();
    next.replaceFrom(this);
    return next;
  }
  replaceFrom(source: InMemoryAssetImageRepository): void {
    this.items = copy(source.items);
    this.nextId = source.nextId;
  }
}

@Injectable()
export class InMemoryAssetFolderRepository implements AssetFolderRepository {
  private items = new Map<string, StoredRecord<AssetFolderRecord>>();
  private activeItems(): AssetFolderRecord[] {
    return [...this.items.values()].flatMap(item => {
      const record = activeRecord<AssetFolderRecord>(item);
      return record ? [record] : [];
    });
  }
  private nextId = 1;
  constructor(
    @Inject(ASSET_IMAGE_REPOSITORY) private readonly images: InMemoryAssetImageRepository,
    @Optional() @Inject(ADMIN_REPOSITORY) private readonly admins?: AdminRepository
  ) {}

  async list(scope: AssetQueryScope): Promise<AssetFolderRecord[]> {
    const counts = this.images.countByFolder();
    return this.activeItems()
      .filter(x => inScope(x, scope))
      .map(x => ({ ...copy(x), imageCount: counts.get(x.id) ?? 0 }));
  }
  async listOwnerIds(): Promise<string[]> {
    return [...new Set(this.activeItems().map(x => x.ownerId))];
  }
  async lockOwner(ownerId: string, requireActive = false): Promise<void> {
    if (!this.admins) return;
    const admin = await this.admins.findById(ownerId);
    if (!admin || admin.deletedAt) throw new DomainNotFoundError('归属管理员');
    if (requireActive && !admin.isActive) throw new ForbiddenException('归属管理员已停用');
  }
  async findById(id: string): Promise<AssetFolderRecord | null> {
    return activeRecord(this.items.get(id));
  }
  async findByName(
    ownerId: string,
    parentId: string | null,
    name: string,
    excludeId?: string
  ): Promise<AssetFolderRecord | null> {
    return copy(
      this.activeItems().find(
        x => x.ownerId === ownerId && x.parentId === parentId && x.name === name && x.id !== excludeId
      ) ?? null
    );
  }
  async listDescendants(id: string): Promise<AssetFolderRecord[]> {
    const root = await this.findById(id);
    if (!root) return [];
    const ids = new Set([id]);
    let previousSize = 0;
    while (previousSize !== ids.size) {
      previousSize = ids.size;
      for (const item of this.activeItems()) {
        if (item.ownerId === root.ownerId && item.parentId && ids.has(item.parentId)) ids.add(item.id);
      }
    }
    return this.activeItems()
      .filter(x => ids.has(x.id))
      .map(copy);
  }
  async create(input: AssetFolderCreateInput): Promise<AssetFolderRecord> {
    if (await this.findByName(input.ownerId, input.parentId, input.name))
      throw new DomainConflictError('同级文件夹名称已存在');
    const now = new Date();
    const item = { ...input, id: String(this.nextId++), imageCount: 0, createdAt: now, updatedAt: now };
    this.items = new Map([...this.items, [item.id, { ...copy(item), deletedAt: null }]]);
    return copy(item);
  }
  async update(id: string, input: AssetFolderUpdateInput): Promise<AssetFolderRecord> {
    const item = await this.findById(id);
    if (!item) throw new DomainNotFoundError('素材文件夹');
    const next = { ...item, ...input, updatedAt: new Date() };
    if (await this.findByName(next.ownerId, next.parentId, next.name, id))
      throw new DomainConflictError('同级文件夹名称已存在');
    this.items = new Map([...this.items, [id, { ...copy(next), deletedAt: null }]]);
    return copy(next);
  }
  async softDelete(id: string): Promise<void> {
    if (!(await this.findById(id))) throw new DomainNotFoundError('素材文件夹');
    await this.softDeleteMany([id]);
  }
  async softDeleteMany(ids: string[]): Promise<void> {
    const selected = new Set(ids);
    const now = new Date();
    this.items = new Map(
      [...this.items].map(([id, item]) => [
        id,
        item.deletedAt === null && selected.has(id) ? { ...item, deletedAt: now, updatedAt: now } : item
      ])
    );
  }
  fork(images: InMemoryAssetImageRepository): InMemoryAssetFolderRepository {
    const next = new InMemoryAssetFolderRepository(images, this.admins);
    next.replaceFrom(this);
    return next;
  }
  replaceFrom(source: InMemoryAssetFolderRepository): void {
    this.items = copy(source.items);
    this.nextId = source.nextId;
  }
}

const transactionQueues = new WeakMap<InMemoryAssetFolderRepository, Promise<void>>();
@Injectable()
export class InMemoryAssetTransactionRunner implements AssetTransactionRunner {
  constructor(
    @Inject(ASSET_FOLDER_REPOSITORY) private readonly folders: InMemoryAssetFolderRepository,
    @Inject(ASSET_IMAGE_REPOSITORY) private readonly images: InMemoryAssetImageRepository
  ) {}
  async run<T>(callback: (repositories: AssetTransactionRepositories) => Promise<T>): Promise<T> {
    const previous = transactionQueues.get(this.folders) ?? Promise.resolve();
    let release!: () => void;
    const current = new Promise<void>(resolve => {
      release = resolve;
    });
    transactionQueues.set(this.folders, current);
    await previous;
    try {
      const images = this.images.fork();
      const folders = this.folders.fork(images);
      const result = await callback({ folders, images });
      this.images.replaceFrom(images);
      this.folders.replaceFrom(folders);
      return result;
    } finally {
      release();
    }
  }
}
