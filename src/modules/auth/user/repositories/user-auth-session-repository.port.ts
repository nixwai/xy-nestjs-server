import type { UserAuthSessionInput, UserSessionRecord } from '../types/user-session.types.js';

/** 用户认证会话仓储注入令牌。 */
export const USER_AUTH_SESSION_REPOSITORY = Symbol('USER_AUTH_SESSION_REPOSITORY');

/** 用户刷新令牌会话持久化访问契约。 */
export interface UserAuthSessionRepository {
  /** 按刷新令牌摘要查询会话。 */
  findByTokenHash(tokenHash: string): Promise<UserSessionRecord | null>;
  /** 创建会话。 */
  create(input: UserAuthSessionInput): Promise<UserSessionRecord>;
  /** 轮换会话。 */
  rotate(
    sessionId: string,
    replacement: UserAuthSessionInput,
    now: Date
  ): Promise<{ status: 'rotated'; session: UserSessionRecord } | { status: 'missing' | 'expired' | 'replayed' }>;
  /** 按令牌摘要撤销会话。 */
  revokeByTokenHash(tokenHash: string, now: Date): Promise<boolean>;
  /** 撤销当前会话及其后续会话。 */
  revokeChain(sessionId: string, now: Date): Promise<void>;
}
