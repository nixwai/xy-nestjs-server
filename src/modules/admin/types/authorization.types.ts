import type { PermissionRecord } from '#/modules/authorization/types/permission.types.js';
import type { RoleRecord } from '#/modules/role/types/role.types.js';
import type { AdminPublicRecord } from './admin.types.js';
/** 管理员授权上下文，包含公开信息、角色和当前可用权限。 */
export interface AdminAuthorization {
  /** 当前管理员信息。 */
  admin: AdminPublicRecord;
  /** 当前管理员拥有的角色列表。 */
  roles: RoleRecord[];
  /** 当前身份可使用的权限编码列表。 */
  permissions: PermissionRecord[];
}

/** 管理端导航菜单树节点。 */
export interface MenuTreeItem {
  /** 菜单 ID。 */
  id: string;
  /** 菜单稳定标识。 */
  menuKey: string;
  /** 菜单标题。 */
  title: string;
  /** 前端路由路径。 */
  path: string;
  /** 同级排序值。 */
  order: number;
  /** 菜单绑定的权限编码，null 表示无权限要求。 */
  permissionCode: string | null;
  /** 可见子菜单，叶子节点不返回该属性。 */
  children?: MenuTreeItem[];
}

/** 管理端授权视图，返回可用权限编码和可见菜单树。 */
export interface AdminAuthorizationView {
  /** 当前身份可使用的权限编码列表。 */
  permissions: string[];
  /** 当前身份可见的菜单列表。 */
  menus: MenuTreeItem[];
}
