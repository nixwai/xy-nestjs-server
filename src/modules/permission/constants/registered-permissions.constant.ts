import { PermissionCode } from '#/modules/authorization/constants/index.js';
import type { RegisteredPermission } from '#/modules/authorization/types/permission.types.js';

/** 分组内声明的权限定义，分类由所在分组回填。 */
export type RegisteredPermissionEntry = Omit<RegisteredPermission, 'category'>;

/** 权限分组的注册定义，是权限目录唯一的代码编辑入口。 */
export interface RegisteredPermissionGroup {
  /** 权限分类标识，同时作为组内权限编码的首段。 */
  category: string;
  /** 管理后台展示的分类名称。 */
  name: string;
  /** 该分类下的权限定义。 */
  permissions: RegisteredPermissionEntry[];
}

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

/** 权限分类标识。 */
export type PermissionCategory = (typeof REGISTERED_PERMISSION_GROUPS)[number]['category'];

/** 将分组注册表铺平为权限定义，供启动同步和一致性校验消费。 */
export const REGISTERED_PERMISSIONS: RegisteredPermission[] = REGISTERED_PERMISSION_GROUPS.flatMap(group =>
  group.permissions.map(permission => ({ ...permission, category: group.category }))
);
