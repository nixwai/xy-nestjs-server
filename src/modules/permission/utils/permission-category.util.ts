import { REGISTERED_PERMISSION_GROUPS } from '../constants/registered-permissions.constant.js';

/** 查询分类展示名称，未注册的分类返回分类标识本身。 */
export function getPermissionCategoryName(category: string): string {
  return REGISTERED_PERMISSION_GROUPS.find(group => group.category === category)?.name ?? category;
}

/** 查询分类展示顺序，未注册的分类排在已注册分类之后。 */
export function getPermissionCategoryOrder(category: string): number {
  const index = REGISTERED_PERMISSION_GROUPS.findIndex(group => group.category === category);
  return index === -1 ? REGISTERED_PERMISSION_GROUPS.length : index;
}
