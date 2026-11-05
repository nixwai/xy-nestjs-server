import type { PermissionCode } from '#/modules/authorization/constants/index.js';

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

/** 后端维护的嵌套菜单注册表，层级关系由 children 结构表达。 */
export const REGISTERED_MENUS: readonly RegisteredMenu[] = [
  {
    menuKey: 'home',
    title: '工作台',
    path: '/home',
    order: 1,
    permissionCode: null,
    isRootOnly: false
  }
];

/** 深度优先展开嵌套菜单，父子层级由结构保证，无需引用校验。 */
export function flattenRegisteredMenus(
  menus: readonly RegisteredMenu[] = REGISTERED_MENUS,
  parentKey: string | null = null
): RegisteredMenuEntry[] {
  return menus.flatMap(menu => {
    const { children, ...entry } = menu;
    return [{ ...entry, parentKey }, ...flattenRegisteredMenus(children ?? [], menu.menuKey)];
  });
}
