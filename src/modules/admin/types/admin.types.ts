/** 管理员账户持久化记录。 */
export interface AdminRecord {
  /** 唯一标识。 */
  id: string;
  /** 登录用户名。 */
  username: string;
  /** 密码哈希值。 */
  passwordHash: string;
  /** 密码盐值。 */
  passwordSalt: string;
  /** 是否启用。 */
  isActive: boolean;
  /** 是否为根管理员。 */
  isRoot: boolean;
  /** 记录删除时间。 */
  deletedAt: Date | null;
  /** 记录创建时间。 */
  createdAt: Date;
  /** 记录更新时间。 */
  updatedAt: Date;
}

/** 可对外公开的管理员信息，不包含密码和删除标记。 */
export interface AdminPublicRecord {
  /** 唯一标识。 */
  id: string;
  /** 登录用户名。 */
  username: string;
  /** 是否启用。 */
  isActive: boolean;
  /** 是否为根管理员。 */
  isRoot: boolean;
  /** 管理员拥有的角色标识列表。 */
  roleIds: string[];
  /** 记录创建时间。 */
  createdAt: Date;
  /** 记录更新时间。 */
  updatedAt: Date;
}

/** 管理员创建输入。 */
export interface AdminCreateInput {
  /** 登录用户名。 */
  username: string;
  /** scrypt 密码摘要。 */
  passwordHash: string;
  /** scrypt 密码盐。 */
  passwordSalt: string;
  /** 是否创建为根管理员。 */
  isRoot?: boolean;
}

/** 管理员更新输入，只包含允许修改的属性。 */
export type AdminUpdateInput = Partial<
  Pick<AdminRecord, 'username' | 'isActive' | 'isRoot' | 'passwordHash' | 'passwordSalt'>
>;
