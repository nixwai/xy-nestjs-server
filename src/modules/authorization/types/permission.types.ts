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

/** 权限注册表维护的权限定义，不包含数据库保存的启用状态。 */
export type RegisteredPermission = Omit<PermissionRecord, 'id' | 'isActive'>;

/** 启动同步可对齐的代码维护字段，权限编码是身份标识不参与修改。 */
export type PermissionDefinitionPatch = Partial<Omit<RegisteredPermission, 'code'>>;

/** 按分类分组的权限目录。 */
export interface PermissionGroup {
  /** 权限分类标识。 */
  category: string;
  /** 权限分类展示名称。 */
  categoryName: string;
  /** 该分类下的权限记录。 */
  permissions: PermissionRecord[];
}
