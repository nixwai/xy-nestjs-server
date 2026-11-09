import type { PageResult } from '#/common/types/index.js';
import type {

  AssetFolderCreateInput,
  AssetFolderRecord,
  AssetFolderUpdateInput,
  AssetImageCreateInput,
  AssetImageQuery,
  AssetImageRecord
} from '../types/asset.types.js';

export const ASSET_FOLDER_REPOSITORY = Symbol('ASSET_FOLDER_REPOSITORY');
export const ASSET_IMAGE_REPOSITORY = Symbol('ASSET_IMAGE_REPOSITORY');
export interface AssetFolderRepository {
  list(ownerId?: string): Promise<AssetFolderRecord[]>;
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
}
