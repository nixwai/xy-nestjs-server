import type { PermissionCode } from '#/modules/authorization/types/permission-code.types.js';

/** 嵌套菜单定义，children 数组直接表达父子层级。 */
export interface RegisteredMenu {
  /** 菜单稳定标识。 */
  menuKey: string;

  /** 默认标题，仅用于首次插入数据库。 */
  title: string;

  /** 前端路由路径。 */
  path: string;

  /** 默认排序，仅用于首次插入数据库。 */
  order: number;

  /** 绑定的权限编码，null 表示无权限要求。 */
  permissionCode: PermissionCode | null;

  /** 是否仅根管理员可见。 */
  isRootOnly: boolean;

  /** 子菜单定义。 */
  children?: readonly RegisteredMenu[];
}

/** 深度优先扁平化后的注册表条目，用于数据库同步与校验。 */
export interface RegisteredMenuEntry extends Omit<RegisteredMenu, 'children'> {
  /** 父菜单稳定标识，根节点为 null。 */
  parentKey: string | null;
}
