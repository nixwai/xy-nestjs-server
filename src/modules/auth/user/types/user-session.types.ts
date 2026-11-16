/** 用户刷新令牌会话持久化记录。 */
export interface UserSessionRecord {
  /** 会话主键。 */
  id: string;
  /** 目标用户主键。 */
  userId: string;
  /** 刷新令牌摘要。 */
  tokenHash: string;
  /** 会话过期时间。 */
  expiresAt: Date;
  /** 会话撤销时间。 */
  revokedAt: Date | null;
  /** 后续替代会话主键。 */
  replacedBySessionId: string | null;
  /** 创建时间。 */
  createdAt: Date;
  /** 最近使用时间。 */
  lastUsedAt: Date | null;
}

/** 用户刷新令牌会话创建输入。 */
export interface UserAuthSessionInput {
  /** 会话归属用户主键。 */
  userId: string;
  /** 刷新令牌摘要。 */
  tokenHash: string;
  /** 会话过期时间。 */
  expiresAt: Date;
}
