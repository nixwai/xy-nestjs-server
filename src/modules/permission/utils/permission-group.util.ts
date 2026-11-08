import type { PermissionGroup, PermissionRecord } from '#/modules/authorization/types/permission.types.js';
import { getPermissionCategoryName, getPermissionCategoryOrder } from './permission-category.util.js';

/** 按分类声明顺序将权限记录分组，未声明的分类排在最后。 */
export function buildPermissionGroups(permissions: PermissionRecord[]): PermissionGroup[] {
  const byCategory = new Map<string, PermissionRecord[]>();
  permissions.forEach(permission =>
    byCategory.set(permission.category, [...(byCategory.get(permission.category) ?? []), permission])
  );
  return [...byCategory.entries()]
    .sort(
      ([left], [right]) =>
        getPermissionCategoryOrder(left) - getPermissionCategoryOrder(right) || left.localeCompare(right)
    )
    .map(([category, items]) => ({
      category,
      categoryName: getPermissionCategoryName(category),
      permissions: items
    }));
}

/** 统计分组结果中的权限总数。 */
export function countPermissions(groups: PermissionGroup[]): number {
  return groups.reduce((total, group) => total + group.permissions.length, 0);
}
