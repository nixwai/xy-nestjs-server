/** 用户持久化记录。 */
export interface UserRecord {
  /** 用户主键。 */
  id: string;
  /** 微信小程序 openId。 */
  openId: string | null;
  /** 微信 UnionId。 */
  unionId: string | null;
  /** 展示昵称。 */
  nickname: string | null;
  /** 头像地址。 */
  avatarUrl: string | null;
  /** 是否允许登录和使用服务。 */
  isActive: boolean;
  /** 最近登录时间。 */
  lastLoginAt: Date | null;
  /** 软删除时间。 */
  deletedAt: Date | null;
  /** 创建时间。 */
  createdAt: Date;
  /** 更新时间。 */
  updatedAt: Date;
}

/** 创建用户的持久化输入。 */
export interface UserCreateInput {
  /** 微信小程序 openId，非微信登录方式可为空。 */
  openId?: string | null;
  /** 微信 UnionId，非微信登录方式可为空。 */
  unionId?: string | null;
  /** 展示昵称。 */
  nickname?: string | null;
  /** 头像地址。 */
  avatarUrl?: string | null;
  /** 是否允许登录。 */
  isActive?: boolean;
  /** 最近登录时间。 */
  lastLoginAt?: Date | null;
}

/** 微信登录创建或更新用户的输入。 */
export interface UserWechatIdentityInput {
  /** 微信小程序 openId。 */
  openId: string;
  /** 微信 UnionId。 */
  unionId?: string;
  /** 客户端授权后提供的昵称。 */
  nickname?: string;
  /** 客户端授权后提供的头像地址。 */
  avatarUrl?: string;
  /** 当前登录时间。 */
  lastLoginAt?: Date;
}

/** 后台用户资料更新输入。 */
export interface UserUpdateInput {
  /** 微信 UnionId。 */
  unionId?: string | null;
  /** 展示昵称。 */
  nickname?: string | null;
  /** 头像地址。 */
  avatarUrl?: string | null;
  /** 是否允许登录。 */
  isActive?: boolean;
  /** 最近登录时间。 */
  lastLoginAt?: Date | null;
}

/** 后台用户列表公开记录。 */
export interface UserAdminRecord {
  /** 用户主键。 */
  id: string;
  /** 微信小程序 openId。 */
  openId: string | null;
  /** 微信 UnionId。 */
  unionId: string | null;
  /** 展示昵称。 */
  nickname: string | null;
  /** 头像地址。 */
  avatarUrl: string | null;
  /** 是否允许登录和使用服务。 */
  isActive: boolean;
  /** 最近登录时间。 */
  lastLoginAt: Date | null;
  /** 创建时间。 */
  createdAt: Date;
  /** 更新时间。 */
  updatedAt: Date;
}

/** 小程序个人页公开记录。 */
export interface UserProfileRecord {
  /** 用户主键。 */
  id: string;
  /** 展示昵称。 */
  nickname: string | null;
  /** 头像地址。 */
  avatarUrl: string | null;
  /** 是否允许登录和使用服务。 */
  isActive: boolean;
  /** 创建时间。 */
  createdAt: Date;
  /** 更新时间。 */
  updatedAt: Date;
}
