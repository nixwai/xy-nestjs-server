import type { AuthSessionRepository } from './auth-session-repository.port.js';
import type { AdminSessionRecord, AuthSessionInput, SessionRotationResult } from '../types/session.types.js';
/** 在无数据库测试环境中保存刷新会话。 */
export class InMemoryAuthSessionRepository implements AuthSessionRepository {
  /** 内存中的认证会话。 */
  private readonly sessions = new Map<string, AdminSessionRecord>();
  /** 下一个可分配的内存记录标识。 */
  private nextId = 1;
  /** findByTokenHash。 */
  async findByTokenHash(tokenHash: string): Promise<AdminSessionRecord | null> {
    return [...this.sessions.values()].find(item => item.tokenHash === tokenHash) ?? null;
  }

  /** 创建记录 */
  async create(input: AuthSessionInput): Promise<AdminSessionRecord> {
    const item: AdminSessionRecord = {
      id: String(this.nextId++),
      ...input,
      revokedAt: null,
      replacedBySessionId: null,
      createdAt: new Date(),
      lastUsedAt: null
    };
    this.sessions.set(item.id, item);
    return item;
  }

  /** rotate。 */
  async rotate(sessionId: string, replacement: AuthSessionInput, now: Date): Promise<SessionRotationResult> {
    const current = this.sessions.get(sessionId);
    if (!current) {
      return { status: 'missing' };
    }
    if (current.revokedAt) {
      return { status: 'replayed' };
    }
    if (current.expiresAt <= now) {
      this.sessions.set(sessionId, {
        ...current,
        revokedAt: now,
        lastUsedAt: now
      });
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

  /** revokeByTokenHash。 */
  async revokeByTokenHash(tokenHash: string, now: Date): Promise<boolean> {
    const item = await this.findByTokenHash(tokenHash);
    if (!item) {
      return false;
    }
    if (item.revokedAt) {
      return true;
    }
    this.sessions.set(item.id, { ...item, revokedAt: now, lastUsedAt: now });
    return true;
  }

  /** 按会话族撤销所有刷新会话。 */
  async revokeBySessionFamilyId(sessionFamilyId: string, now: Date): Promise<void> {
    for (const item of this.sessions.values()) {
      if (item.sessionFamilyId === sessionFamilyId && !item.revokedAt) {
        this.sessions.set(item.id, { ...item, revokedAt: now, lastUsedAt: now });
      }
    }
  }

  /** 删除已失效且超过保留期的会话族。 */
  async deleteExpiredFamilies(now: Date, cutoff: Date, limit: number): Promise<number> {
    if (limit <= 0) {
      return 0;
    }
    const families = new Map<string, AdminSessionRecord[]>();
    for (const item of this.sessions.values()) {
      const family = families.get(item.sessionFamilyId) ?? [];
      families.set(item.sessionFamilyId, [...family, item]);
    }
    let deleted = 0;
    for (const items of families.values()) {
      const hasActiveSession = items.some(item => !item.revokedAt && item.expiresAt > now);
      const lastExpiry = items.reduce(
        (latest, item) => (item.expiresAt > latest ? item.expiresAt : latest),
        new Date(0)
      );
      if (!hasActiveSession && lastExpiry <= cutoff) {
        for (const item of items) {
          this.sessions.delete(item.id);
          deleted += 1;
        }
        if (--limit === 0) {
          break;
        }
      }
    }
    return deleted;
  }
}
