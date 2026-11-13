import { PermissionCode } from '#/modules/authorization/constants/index.js';
import type { RegisteredPermission } from '#/modules/authorization/types/permission.types.js';
import type { RegisteredPermissionGroup } from '../types/registered-permission.types.js';

/** 后端维护的权限注册表，服务启动时据此校验并补齐数据库权限定义。 */
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
      {
        code: PermissionCode.ASSET_FOLDER_ALL,
        name: '全局素材管理',
        description: '查看其他拥有者的素材文件夹，并允许跨拥有者操作',
        isAssignable: true,
        isProtected: false
      },
      {
        code: PermissionCode.ASSET_FOLDER_READ,
        name: '查看文件夹',
        description: '查看自己拥有的素材文件夹',
        isAssignable: true,
        isProtected: false
      },
      {
        code: PermissionCode.ASSET_FOLDER_CREATE,
        name: '创建文件夹',
        description: '创建素材文件夹',
        isAssignable: true,
        isProtected: false
      },
      {
        code: PermissionCode.ASSET_FOLDER_UPDATE,
        name: '编辑文件夹',
        description: '重命名素材文件夹',
        isAssignable: true,
        isProtected: false
      },
      {
        code: PermissionCode.ASSET_FOLDER_DELETE,
        name: '删除文件夹',
        description: '删除空素材文件夹',
        isAssignable: true,
        isProtected: false
      }
    ]
  }
];

/** 将分组注册表铺平为权限定义，供启动同步和一致性校验消费。 */
export const REGISTERED_PERMISSIONS: RegisteredPermission[] = REGISTERED_PERMISSION_GROUPS.flatMap(group =>
  group.permissions.map(permission => ({ ...permission, category: group.category }))
);
