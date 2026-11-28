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
      },
      {
        code: PermissionCode.USER_READ,
        name: '查看用户',
        description: '查看微信用户列表和公开资料',
        isAssignable: true,
        isProtected: false
      },
      {
        code: PermissionCode.USER_UPDATE,
        name: '编辑用户',
        description: '更新微信用户展示资料和启用状态',
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
      },
      {
        code: PermissionCode.ASSET_IMAGE_READ,
        name: '查看素材图片',
        description: '查看当前文件夹直属的素材图片',
        isAssignable: true,
        isProtected: false
      },
      {
        code: PermissionCode.ASSET_IMAGE_UPLOAD,
        name: '上传素材图片',
        description: '向有权访问的素材文件夹上传图片',
        isAssignable: true,
        isProtected: false
      },
      {
        code: PermissionCode.ASSET_IMAGE_UPDATE,
        name: '编辑素材图片',
        description: '重命名有权访问的素材图片',
        isAssignable: true,
        isProtected: false
      },
      {
        code: PermissionCode.ASSET_IMAGE_DELETE,
        name: '删除素材图片',
        description: '删除有权访问的素材图片',
        isAssignable: true,
        isProtected: false
      },
      {
        code: PermissionCode.ASSET_IMAGE_MOVE,
        name: '移动素材图片',
        description: '调整有权访问的素材图片所属文件夹',
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
