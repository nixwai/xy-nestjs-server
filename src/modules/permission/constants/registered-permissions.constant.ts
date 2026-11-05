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
  }
];

/** 将分组注册表铺平为权限定义，供启动同步和一致性校验消费。 */
export const REGISTERED_PERMISSIONS: RegisteredPermission[] = REGISTERED_PERMISSION_GROUPS.flatMap(group =>
  group.permissions.map(permission => ({ ...permission, category: group.category }))
);
