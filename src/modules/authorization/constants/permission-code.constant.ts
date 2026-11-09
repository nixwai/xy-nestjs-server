/** 系统动态权限编码常量。 */
export const PermissionCode = {
  AUDIT_READ: 'system.audit.read',
  ASSET_FOLDER_READ: 'asset.folder.read',
  ASSET_FOLDER_READ_ALL: 'asset.folder.read-all',
  ASSET_FOLDER_CREATE: 'asset.folder.create',
  ASSET_FOLDER_UPDATE: 'asset.folder.update',
  ASSET_FOLDER_DELETE: 'asset.folder.delete',
  ASSET_IMAGE_READ: 'asset.image.read',
  ASSET_IMAGE_READ_ALL: 'asset.image.read-all',
  ASSET_IMAGE_UPLOAD: 'asset.image.upload',
  ASSET_IMAGE_MOVE: 'asset.image.move',
  ASSET_IMAGE_DELETE: 'asset.image.delete'
} as const;
