import type { AdminSessionRecord, AuthSessionInput, SessionRotationResult } from '../types/session.types.js';

/** 认证会话仓储注入令牌。 */
export const AUTH_SESSION_REPOSITORY = Symbol('AUTH_SESSION_REPOSITORY');

/** 刷新令牌会话持久化访问契约。 */
export interface AuthSessionRepository {
  findByTokenHash(tokenHash: string): Promise<AdminSessionRecord | null>;
  create(input: AuthSessionInput): Promise<AdminSessionRecord>;
  rotate(sessionId: string, replacement: AuthSessionInput, now: Date): Promise<SessionRotationResult>;
  revokeByTokenHash(tokenHash: string, now: Date): Promise<boolean>;
  revokeChain(sessionId: string, now: Date): Promise<void>;
}
