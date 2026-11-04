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
