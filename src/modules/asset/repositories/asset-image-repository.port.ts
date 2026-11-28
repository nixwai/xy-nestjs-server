import type { PageQueryDto } from '#/common/dto/index.js';
import type { PageResult } from '#/common/types/index.js';
import type {
  AssetImageCreateInput,
  AssetImageUpdateInput,
  AssetImageFolderSearchQuery,
  AssetImageRecord
} from '../types/asset-image.types.js';

/** 素材图片仓储注入令牌。 */
export const ASSET_IMAGE_REPOSITORY = Symbol('ASSET_IMAGE_REPOSITORY');

/** 素材图片持久化访问契约。 */
export interface AssetImageRepository {
  /** 按直属文件夹分页查询有效图片。 */
  list(query: PageQueryDto & { folderId: string }): Promise<PageResult<AssetImageRecord>>;
  /** 在指定文件夹集合内按图片原始文件名分页搜索。 */
  search(query: AssetImageFolderSearchQuery): Promise<PageResult<AssetImageRecord>>;
  /** 按主键查询有效图片。 */
  findById(id: string): Promise<AssetImageRecord | null>;
  /** 查询同一文件夹下的同名有效图片。 */
  findByName(folderId: string, originalName: string, excludeId?: string): Promise<AssetImageRecord | null>;
  /** 更新图片名称。 */
  update(id: string, input: AssetImageUpdateInput): Promise<AssetImageRecord>;
  /** 软删除图片。 */
  softDelete(id: string): Promise<void>;
  /** 修改图片所属文件夹。 */
  move(id: string, folderId: string, ownerId: string): Promise<AssetImageRecord>;
  /** 统计直属文件夹中的有效图片数量。 */
  countByFolderId(folderId: string): Promise<number>;
  /** 创建素材图片记录。 */
  create(input: AssetImageCreateInput): Promise<AssetImageRecord>;
}
