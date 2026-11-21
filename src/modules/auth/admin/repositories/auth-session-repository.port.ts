import type { AdminSessionRecord, AuthSessionInput, SessionRotationResult } from '../types/session.types.js';
/** 认证会话仓储注入令牌。 */
export const AUTH_SESSION_REPOSITORY = Symbol('AUTH_SESSION_REPOSITORY');
/** 刷新令牌会话持久化访问契约。 */
export interface AuthSessionRepository {
  /** findByTokenHash。 */
  findByTokenHash(tokenHash: string): Promise<AdminSessionRecord | null>;
  /** 创建记录 */
  create(input: AuthSessionInput): Promise<AdminSessionRecord>;
  /** rotate。 */
  rotate(sessionId: string, replacement: AuthSessionInput, now: Date): Promise<SessionRotationResult>;
  /** revokeByTokenHash。 */
  revokeByTokenHash(tokenHash: string, now: Date): Promise<boolean>;
  /** 按会话族撤销所有刷新会话。 */
  revokeBySessionFamilyId(sessionFamilyId: string, now: Date): Promise<void>;
  /** 删除已失效且超过保留期的会话族。 */
  deleteExpiredFamilies(now: Date, cutoff: Date, limit: number): Promise<number>;
}
