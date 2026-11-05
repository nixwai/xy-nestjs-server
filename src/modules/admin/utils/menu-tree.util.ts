import type { MenuListItem } from '#/modules/menu/types/menu.types.js';
import type { MenuTreeItem } from '../types/authorization.types.js';

/**
 * 按当前管理员的根身份和权限编码构建可见菜单树。
 *
 * @param items - 带权限可用状态的菜单列表。
 * @param isRoot - 当前管理员是否为根管理员。
 * @param permissions - 当前管理员持有的权限编码集合。
 * @returns 过滤并排序后的菜单树，无可见子菜单的目录节点会被剔除。
 */
export function buildMenuTree(items: MenuListItem[], isRoot: boolean, permissions: Set<string>): MenuTreeItem[] {
  const byParent = new Map<string | null, MenuListItem[]>();
  items.forEach(item => byParent.set(item.parentKey, [...(byParent.get(item.parentKey) ?? []), item]));

  const build = (parentKey: string | null): MenuTreeItem[] => {
    return (byParent.get(parentKey) ?? [])
      .filter(item => item.isActive && (!item.isRootOnly || isRoot) && isPermissionAvailable(item, permissions))
      .sort((left, right) => left.order - right.order || Number(left.id) - Number(right.id))
      .flatMap(item => {
        const children = build(item.menuKey);
        const isDirectory = item.permissionCode === null && item.menuKey !== 'home';
        if (isDirectory && children.length === 0) return [];
        return [
          {
            id: item.id,
            menuKey: item.menuKey,
            title: item.title,
            path: item.path,
            order: item.order,
            permissionCode: item.permissionCode,
            ...(children.length > 0 ? { children } : {})
          }
        ];
      });
  };

  return build(null);
}

/** 判断菜单绑定的权限对当前管理员是否可用。 */
function isPermissionAvailable(item: MenuListItem, permissions: Set<string>): boolean {
  if (!item.permissionCode) return true;
  return item.permissionAvailable && permissions.has(item.permissionCode);
}
