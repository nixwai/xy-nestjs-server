/** 角色持久化记录。 */
export interface RoleRecord {
  id: string;
  code: string;
  name: string;
  description: string | null;
  isActive: boolean;
  isSystem: boolean;
  isProtected: boolean;
  deletedAt: Date | null;
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

/** 角色更新输入，只包含允许修改的字段。 */
export type RoleUpdateInput = Partial<Pick<RoleRecord, 'name' | 'description' | 'isActive'>>;
