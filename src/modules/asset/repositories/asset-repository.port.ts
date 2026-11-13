import type {
  AssetFolderCreateInput,
  AssetFolderQueryScope,
  AssetFolderRecord,
  AssetFolderUpdateInput
} from '../types/index.js';

/** 素材文件夹仓储注入令牌。 */
export const ASSET_FOLDER_REPOSITORY = Symbol('ASSET_FOLDER_REPOSITORY');

/** 素材文件夹持久化访问契约。 */
export interface AssetFolderRepository {
  /** 按数据范围查询有效文件夹。 */
  list(scope: AssetFolderQueryScope): Promise<AssetFolderRecord[]>;
  /** 按主键查询有效文件夹。 */
  findById(id: string): Promise<AssetFolderRecord | null>;
  /** 查询同一拥有者、同一父级下的同名文件夹。 */
  findByName(
    ownerId: string,
    parentId: string | null,
    name: string,
    excludeId?: string
  ): Promise<AssetFolderRecord | null>;
  /** 查询有效子文件夹。 */
  listChildren(parentId: string): Promise<AssetFolderRecord[]>;
  /** 创建文件夹。 */
  create(input: AssetFolderCreateInput): Promise<AssetFolderRecord>;
  /** 更新文件夹名称。 */
  update(id: string, input: AssetFolderUpdateInput): Promise<AssetFolderRecord>;
  /** 软删除文件夹。 */
  softDelete(id: string): Promise<void>;
}
