/** 系统动态权限编码常量，键名使用大写下划线，值与权限注册表编码一致。 */
export const PermissionCode = {
  AUDIT_READ: 'system.audit.read',
  ASSET_FOLDER_READ: 'asset.folder.read',
  ASSET_FOLDER_ALL: 'asset.folder.all',
  ASSET_FOLDER_CREATE: 'asset.folder.create',
  ASSET_FOLDER_UPDATE: 'asset.folder.update',
  ASSET_FOLDER_DELETE: 'asset.folder.delete'
} as const;
