import { PermissionCode } from '#/modules/authorization/constants/index.js';
import type { RegisteredPermission } from '#/modules/authorization/types/permission.types.js';

/** 权限分组的代码参考定义，仅用于权限目录可视化和类型推导。 */
export interface RegisteredPermissionGroup {
  /** 权限分类标识，同时作为组内权限编码的首段。 */
  category: string;
  /** 管理后台展示的分类名称。 */
  name: string;
  /** 该分类下的权限定义。 */
  permissions: Omit<RegisteredPermission, 'category'>[];
}

/** 权限目录的代码参考结构，仅用于权限目录可视化；数据库权限数据为最终数据源。 */
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
        isProtected: false,
        isActive: true
      }
    ]
  }
];

/** 权限分类标识。 */
export type PermissionCategory = (typeof REGISTERED_PERMISSION_GROUPS)[number]['category'];

/** 将代码参考结构铺平为权限定义，供权限数据迁移生成基础数据。 */
export const REGISTERED_PERMISSIONS: RegisteredPermission[] = REGISTERED_PERMISSION_GROUPS.flatMap(group =>
  group.permissions.map(permission => ({ ...permission, category: group.category }))
);
