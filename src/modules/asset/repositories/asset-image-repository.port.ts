import type { PageQueryDto } from '#/common/dto/index.js';
import type { PageResult } from '#/common/types/index.js';
import type { AssetImageCreateInput, AssetImageRecord } from '../types/asset-image.types.js';

/** 素材图片仓储注入令牌。 */
export const ASSET_IMAGE_REPOSITORY = Symbol('ASSET_IMAGE_REPOSITORY');

/** 素材图片持久化访问契约。 */
export interface AssetImageRepository {
  /** 按直属文件夹分页查询有效图片。 */
  list(query: PageQueryDto & { folderId: string }): Promise<PageResult<AssetImageRecord>>;
  /** 统计直属文件夹中的有效图片数量。 */
  countByFolderId(folderId: string): Promise<number>;
  /** 创建素材图片记录。 */
  create(input: AssetImageCreateInput): Promise<AssetImageRecord>;
}
