import { PermissionCode } from '#/modules/authorization/constants/index.js';
import type { RegisteredPermission } from '#/modules/authorization/types/permission.types.js';
import type { RegisteredPermissionGroup } from '../types/registered-permission.types.js';

export const REGISTERED_PERMISSION_GROUPS: readonly RegisteredPermissionGroup[] = [
  {
    category: 'system',
    name: '系统管理',
    permissions: [
      {
        code: PermissionCode.AUDIT_READ,
        name: '查看审计',
        description: '查看管理员变更审计',
        isAssignable: true,
        isProtected: false
      }
    ]
  },
  {
    category: 'asset',
    name: '素材管理',
    permissions: [
      [PermissionCode.ASSET_FOLDER_READ, '查看文件夹'],
      [PermissionCode.ASSET_FOLDER_READ_ALL, '查看全部文件夹'],
      [PermissionCode.ASSET_FOLDER_CREATE, '创建文件夹'],
      [PermissionCode.ASSET_FOLDER_UPDATE, '编辑文件夹'],
      [PermissionCode.ASSET_FOLDER_DELETE, '删除文件夹'],
      [PermissionCode.ASSET_IMAGE_READ, '查看图片素材'],
      [PermissionCode.ASSET_IMAGE_READ_ALL, '查看全部图片素材'],
      [PermissionCode.ASSET_IMAGE_UPLOAD, '上传图片素材'],
      [PermissionCode.ASSET_IMAGE_MOVE, '移动图片素材'],
      [PermissionCode.ASSET_IMAGE_DELETE, '删除图片素材']
    ].map(([code, name]) => ({ code, name, description: name, isAssignable: true, isProtected: false }))
  }
];

export const REGISTERED_PERMISSIONS: RegisteredPermission[] = REGISTERED_PERMISSION_GROUPS.flatMap(group =>
  group.permissions.map(permission => ({ ...permission, category: group.category }))
);
