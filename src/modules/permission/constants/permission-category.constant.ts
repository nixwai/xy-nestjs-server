/** 权限分类定义。 */
export interface PermissionCategoryDefinition {
  /** 写入权限记录的分类标识。 */
  value: string;
  /** 管理后台展示的分类名称。 */
  name: string;
}

/** 权限分类目录，声明顺序即管理后台的分组展示顺序。 */
export const PERMISSION_CATEGORIES = [
  { value: 'system', name: '系统管理' }
] as const satisfies readonly PermissionCategoryDefinition[];

/** 权限分类标识。 */
export type PermissionCategory = (typeof PERMISSION_CATEGORIES)[number]['value'];

/** 查询分类展示名称，未声明的分类返回分类标识本身。 */
export function getPermissionCategoryName(category: string): string {
  return PERMISSION_CATEGORIES.find(item => item.value === category)?.name ?? category;
}

/** 查询分类展示顺序，未声明的分类排在已声明分类之后。 */
export function getPermissionCategoryOrder(category: string): number {
  const index = PERMISSION_CATEGORIES.findIndex(item => item.value === category);
  return index === -1 ? PERMISSION_CATEGORIES.length : index;
}
