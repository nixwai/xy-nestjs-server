/** 刷新令牌会话持久化记录。 */
export interface AdminSessionRecord {
  /** 唯一标识。 */
  id: string;
  /** 目标管理员的唯一标识。 */
  adminId: string;
  /** 令牌Hash 值。 */
  tokenHash: string;
  /** 会话过期时间。 */
  expiresAt: Date;
  /** 会话撤销时间。 */
  revokedAt: Date | null;
  /** 替代会话标识。 */
  replacedBySessionId: string | null;
  /** 记录创建时间。 */
  createdAt: Date;
  /** 最近使用时间。 */
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
  | {
      /** 当前状态。 */
      status: 'rotated';
      /** 认证会话。 */
      session: AdminSessionRecord;
    }
  | {
      /** 当前状态。 */
      status: 'missing' | 'expired' | 'replayed';
    };
