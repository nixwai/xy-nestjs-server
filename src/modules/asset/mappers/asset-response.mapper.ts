import type { PageResult } from '#/common/types/index.js';
import type { AssetFolderRecord, AssetImageRecord } from '../types/asset.types.js';
import type {
  AssetFolderResponseDto,
  AssetImageResponseDto,
  AssetImagePageResponseDto,
  BatchAssetUploadResponseDto,
  AssetOwnerListResponseDto
} from '../dto/index.js';

/** 显式选择文件夹公开字段，所有者与创建者独立返回。 */
export function toAssetFolderResponse(item: AssetFolderRecord): AssetFolderResponseDto {
  return {
    id: item.id,
    name: item.name,
    parentId: item.parentId,
    ownerId: item.ownerId,
    createdByAdminId: item.createdByAdminId,
    imageCount: item.imageCount,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt
  };
}
/** 显式选择图片公开字段。 */
export function toAssetImageResponse(item: AssetImageRecord): AssetImageResponseDto {
  return {
    id: item.id,
    folderId: item.folderId,
    originalName: item.originalName,
    url: item.url,
    mimeType: item.mimeType,
    size: item.size,
    width: item.width,
    height: item.height,
    ownerId: item.ownerId,
    createdByAdminId: item.createdByAdminId,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt
  };
}
/** 映射分页及其图片，不展开内部记录。 */
export function toAssetImagePage(result: PageResult<AssetImageRecord>): AssetImagePageResponseDto {
  return {
    items: result.items.map(toAssetImageResponse),
    total: result.total,
    page: result.page,
    pageSize: result.pageSize,
    totalPages: result.totalPages,
    hasNextPage: result.hasNextPage,
    hasPreviousPage: result.hasPreviousPage
  };
}
/** 映射批量上传结果。 */
export function toAssetUploadResponse(result: {
  success: AssetImageRecord[];
  failed: { filename: string; reason: string }[];
  totalCount: number;
  successCount: number;
}): BatchAssetUploadResponseDto {
  return {
    success: result.success.map(toAssetImageResponse),
    failed: result.failed.map(item => ({ filename: item.filename, reason: item.reason })),
    totalCount: result.totalCount,
    successCount: result.successCount
  };
}
/** 所有者列表不泄漏密码、角色或其他账户字段。 */
export function toAssetOwnersResponse(result: {
  items: { id: string; username: string; isActive: boolean }[];
  total: number;
}): AssetOwnerListResponseDto {
  return {
    items: result.items.map(item => ({ id: item.id, username: item.username, isActive: item.isActive })),
    total: result.total
  };
}
