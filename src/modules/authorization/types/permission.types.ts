/** 权限目录中的权限记录。 */
export interface PermissionRecord {
  id: string;
  code: string;
  name: string;
  description: string | null;
  category: string;
  isAssignable: boolean;
  isProtected: boolean;
  isActive: boolean;
}

/** 代码注册的权限记录。 */
export type RegisteredPermission = Omit<PermissionRecord, 'id'>;

/** 按分类分组的权限目录。 */
export interface PermissionGroup {
  /** 权限分类标识。 */
  category: string;
  /** 权限分类展示名称。 */
  categoryName: string;
  /** 该分类下的权限记录。 */
  permissions: PermissionRecord[];
}
