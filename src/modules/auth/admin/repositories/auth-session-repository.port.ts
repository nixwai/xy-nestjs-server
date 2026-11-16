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
  /** revokeChain。 */
  revokeChain(sessionId: string, now: Date): Promise<void>;
}
