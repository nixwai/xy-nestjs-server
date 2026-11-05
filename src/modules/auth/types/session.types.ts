/** 刷新令牌会话持久化记录。 */
export interface AdminSessionRecord {
  id: string;
  adminId: string;
  tokenHash: string;
  expiresAt: Date;
  revokedAt: Date | null;
  replacedBySessionId: string | null;
  createdAt: Date;
  lastUsedAt: Date | null;
}

/** 刷新令牌会话的创建和轮换输入。 */
export interface AuthSessionInput {
  /** 会话归属的管理员 ID。 */
  adminId: string;

  /** 刷新令牌的不可逆存储摘要。 */
  tokenHash: string;

  /** 会话过期时间。 */
  expiresAt: Date;
}

/** 会话轮换结果，只有 rotated 携带新会话。 */
export type SessionRotationResult =
  { status: 'rotated'; session: AdminSessionRecord } | { status: 'missing' | 'expired' | 'replayed' };
