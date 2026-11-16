import type { UserAuthSessionRepository } from './user-auth-session-repository.port.js';
import type { UserAuthSessionInput, UserSessionRecord } from '../types/user-session.types.js';

/** 在无数据库测试环境中保存用户刷新会话。 */
export class InMemoryUserAuthSessionRepository implements UserAuthSessionRepository {
  /** 内存中的用户认证会话。 */
  private readonly sessions = new Map<string, UserSessionRecord>();
  /** 下一个可分配的内存记录标识。 */
  private nextId = 1;

  /** 按刷新令牌摘要查询会话。 */
  async findByTokenHash(tokenHash: string): Promise<UserSessionRecord | null> {
    return [...this.sessions.values()].find(item => item.tokenHash === tokenHash) ?? null;
  }

  /** 创建会话。 */
  async create(input: UserAuthSessionInput): Promise<UserSessionRecord> {
    const item: UserSessionRecord = {
      id: String(this.nextId++),
      ...input,
      revokedAt: null,
      replacedBySessionId: null,
      createdAt: new Date(),
      lastUsedAt: null
    };
    this.sessions.set(item.id, item);
    return { ...item };
  }

  /** 轮换会话。 */
  async rotate(
    sessionId: string,
    replacement: UserAuthSessionInput,
    now: Date
  ): Promise<{ status: 'rotated'; session: UserSessionRecord } | { status: 'missing' | 'expired' | 'replayed' }> {
    const current = this.sessions.get(sessionId);
    if (!current) return { status: 'missing' };
    if (current.revokedAt) return { status: 'replayed' };
    if (current.expiresAt <= now) {
      this.sessions.set(sessionId, { ...current, revokedAt: now, lastUsedAt: now });
      return { status: 'expired' };
    }
    const next = await this.create(replacement);
    this.sessions.set(sessionId, {
      ...current,
      revokedAt: now,
      lastUsedAt: now,
      replacedBySessionId: next.id
    });
    return { status: 'rotated', session: next };
  }

  /** 按令牌摘要撤销会话。 */
  async revokeByTokenHash(tokenHash: string, now: Date): Promise<boolean> {
    const item = await this.findByTokenHash(tokenHash);
    if (!item) return false;
    if (item.revokedAt) return true;
    this.sessions.set(item.id, { ...item, revokedAt: now, lastUsedAt: now });
    return true;
  }

  /** 撤销当前会话及其后续会话。 */
  async revokeChain(sessionId: string, now: Date): Promise<void> {
    let item = this.sessions.get(sessionId);
    while (item) {
      if (!item.revokedAt) {
        this.sessions.set(item.id, { ...item, revokedAt: now, lastUsedAt: now });
      }
      item = item.replacedBySessionId ? this.sessions.get(item.replacedBySessionId) : undefined;
    }
  }
}
