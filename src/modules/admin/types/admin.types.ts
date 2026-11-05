/** 管理员账户持久化记录。 */
export interface AdminRecord {
  id: string;
  username: string;
  passwordHash: string;
  passwordSalt: string;
  isActive: boolean;
  isRoot: boolean;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/** 可对外公开的管理员信息，不包含密码和删除标记。 */
export interface AdminPublicRecord {
  id: string;
  username: string;
  isActive: boolean;
  isRoot: boolean;
  roleIds: string[];
  createdAt: Date;
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

/** 管理员更新输入，只包含允许修改的字段。 */
export type AdminUpdateInput = Partial<
  Pick<AdminRecord, 'username' | 'isActive' | 'isRoot' | 'passwordHash' | 'passwordSalt'>
>;
