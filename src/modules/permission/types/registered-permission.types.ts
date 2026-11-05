import type { RegisteredPermission } from '#/modules/authorization/types/permission.types.js';
import type { REGISTERED_PERMISSION_GROUPS } from '../constants/registered-permissions.constant.js';

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

/** 权限分类标识，取值由权限注册表声明。 */
export type PermissionCategory = (typeof REGISTERED_PERMISSION_GROUPS)[number]['category'];
