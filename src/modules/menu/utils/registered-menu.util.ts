import { REGISTERED_MENUS } from '../constants/registered-menus.constant.js';
import type { RegisteredMenu, RegisteredMenuEntry } from '../types/registered-menu.types.js';

/**
 * 深度优先展开嵌套菜单，父子层级由结构保证，无需引用校验。
 *
 * @param menus - 待展开的嵌套菜单定义，默认使用后端注册表。
 * @param parentKey - 当前层级的父菜单标识，根层级为 null。
 * @returns 带父级标识的扁平菜单条目。
 */
export function flattenRegisteredMenus(
  menus: readonly RegisteredMenu[] = REGISTERED_MENUS,
  parentKey: string | null = null
): RegisteredMenuEntry[] {
  return menus.flatMap(menu => {
    const { children, ...entry } = menu;
    return [{ ...entry, parentKey }, ...flattenRegisteredMenus(children ?? [], menu.menuKey)];
  });
}
