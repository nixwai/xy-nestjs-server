import { PermissionCode } from '#/modules/authorization/constants/index.js';
import type { RegisteredPermission } from '#/modules/authorization/types/permission.types.js';
import type { PermissionCategory } from './permission-category.constant.js';

/** 单个分类下由代码维护的权限定义。 */
export interface RegisteredPermissionGroup {
  /** 权限分类标识，同时作为组内权限编码的首段。 */
  category: PermissionCategory;
  /** 该分类下的权限定义。 */
  permissions: Omit<RegisteredPermission, 'category'>[];
}

/** 由代码维护的动态权限目录，按分类分组声明。 */
export const REGISTERED_PERMISSION_GROUPS: readonly RegisteredPermissionGroup[] = [
  {
    category: 'system',
    permissions: [
      {
        code: PermissionCode.AUDIT_READ,
        name: '查看审计',
        description: '查看管理员变更审计',
        isAssignable: true,
        isProtected: false,
        isActive: true
      }
    ]
  }
];

/** 铺平后的权限注册表，作为启动同步的唯一入口。 */
export const REGISTERED_PERMISSIONS: RegisteredPermission[] = REGISTERED_PERMISSION_GROUPS.flatMap(group =>
  group.permissions.map(permission => ({ ...permission, category: group.category }))
);
