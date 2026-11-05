import type { AuthSessionRepository } from './auth-session-repository.port.js';
import type { AdminSessionRecord, AuthSessionInput, SessionRotationResult } from '../types/session.types.js';

/** 在无数据库测试环境中保存刷新会话。 */
export class InMemoryAuthSessionRepository implements AuthSessionRepository {
  private readonly sessions = new Map<string, AdminSessionRecord>();
  private nextId = 1;

  async findByTokenHash(tokenHash: string): Promise<AdminSessionRecord | null> {
    return [...this.sessions.values()].find(item => item.tokenHash === tokenHash) ?? null;
  }

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

  async revokeChain(sessionId: string, now: Date): Promise<void> {
    let item = this.sessions.get(sessionId);
    while (item) {
      if (!item.revokedAt) {
        this.sessions.set(item.id, {
          ...item,
          revokedAt: now,
          lastUsedAt: now
        });
      }
      item = item.replacedBySessionId ? this.sessions.get(item.replacedBySessionId) : undefined;
    }
  }
}
