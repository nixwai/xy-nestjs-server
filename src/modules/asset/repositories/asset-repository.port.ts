import type { PageResult } from '#/common/types/index.js';
import type {
  AssetFolderCreateInput,
  AssetFolderRecord,
  AssetFolderUpdateInput,
  AssetImageCreateInput,
  AssetImageQuery,
  AssetQueryScope,
  AssetImageRecord
} from '../types/asset.types.js';

export const ASSET_FOLDER_REPOSITORY = Symbol('ASSET_FOLDER_REPOSITORY');
export const ASSET_IMAGE_REPOSITORY = Symbol('ASSET_IMAGE_REPOSITORY');
export const ASSET_TRANSACTION_RUNNER = Symbol('ASSET_TRANSACTION_RUNNER');

export interface AssetFolderRepository {
  list(scope: AssetQueryScope): Promise<AssetFolderRecord[]>;
  listOwnerIds(): Promise<string[]>;
  /** 必须在事务内调用，锁定归属管理员行。 */
  lockOwner(ownerId: string, requireActive?: boolean): Promise<void>;
  findByName(
    ownerId: string,
    parentId: string | null,
    name: string,
    excludeId?: string
  ): Promise<AssetFolderRecord | null>;
  /** 包含自身，仅返回有效目录；不存在时返回空数组。 */
  listDescendants(id: string): Promise<AssetFolderRecord[]>;
  softDeleteMany(ids: string[]): Promise<void>;
  findById(id: string): Promise<AssetFolderRecord | null>;
  create(input: AssetFolderCreateInput): Promise<AssetFolderRecord>;
  update(id: string, input: AssetFolderUpdateInput): Promise<AssetFolderRecord>;
  softDelete(id: string): Promise<void>;
}

export interface AssetImageRepository {
  list(query: AssetImageQuery): Promise<PageResult<AssetImageRecord>>;
  create(input: AssetImageCreateInput): Promise<AssetImageRecord>;
  findById(id: string): Promise<AssetImageRecord | null>;
  updateFolder(id: string, folderId: string | null): Promise<AssetImageRecord>;
  softDelete(id: string): Promise<void>;
  moveToRoot(folderId: string): Promise<void>;
  moveFoldersToRoot(ids: string[]): Promise<void>;
  listOwnerIds(): Promise<string[]>;
}

export interface AssetTransactionRepositories {
  folders: AssetFolderRepository;
  images: AssetImageRepository;
}

export interface AssetTransactionRunner {
  run<T>(callback: (repositories: AssetTransactionRepositories) => Promise<T>): Promise<T>;
}
