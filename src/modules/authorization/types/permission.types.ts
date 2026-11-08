/** 权限目录中的权限记录。 */
export interface PermissionRecord {
  /** 唯一标识。 */
  id: string;
  /** 业务编码。 */
  code: string;
  /** 名称。 */
  name: string;
  /** 资源描述。 */
  description: string | null;
  /** 业务分类。 */
  category: string;
  /** 权限是否允许分配给角色。 */
  isAssignable: boolean;
  /** 角色是否受系统保护。 */
  isProtected: boolean;
  /** 是否启用。 */
  isActive: boolean;
}

/** 权限注册表维护的权限定义，不包含数据库保存的启用状态。 */
export type RegisteredPermission = Omit<PermissionRecord, 'id' | 'isActive'>;
/** 启动同步可对齐的代码维护字段，权限编码是身份标识不参与修改。 */
export type PermissionDefinitionPatch = Partial<Omit<RegisteredPermission, 'code'>>;
/** 权限创建输入，编码和分类等代码维护字段由权限注册表提供。 */
export type PermissionCreateInput = Omit<PermissionRecord, 'id'>;
/** 按分类分组的权限目录。 */
export interface PermissionGroup {
  /** 权限分类标识。 */
  category: string;
  /** 权限分类展示名称。 */
  categoryName: string;
  /** 该分类下的权限记录。 */
  permissions: PermissionRecord[];
}
