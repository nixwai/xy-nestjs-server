/** 角色持久化记录。 */
export interface RoleRecord {
  /** 唯一标识。 */
  id: string;
  /** 业务编码。 */
  code: string;
  /** 名称。 */
  name: string;
  /** 资源描述。 */
  description: string | null;
  /** 是否启用。 */
  isActive: boolean;
  /** 角色是否为系统内置角色。 */
  isSystem: boolean;
  /** 角色是否受系统保护。 */
  isProtected: boolean;
  /** 记录删除时间。 */
  deletedAt: Date | null;
  /** 角色关联的权限标识列表。 */
  permissionIds: string[];
}

/** 角色创建输入。 */
export interface RoleCreateInput {
  /** 角色唯一编码。 */
  code: string;
  /** 角色名称。 */
  name: string;
  /** 角色描述。 */
  description?: string;
}

/** 角色更新输入，只包含允许修改的属性。 */
export type RoleUpdateInput = Partial<Pick<RoleRecord, 'name' | 'description' | 'isActive'>>;
