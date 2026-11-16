import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import { UserSessionEntity } from '#/modules/user/entities/user-session.entity.js';
import type { UserAuthSessionRepository } from './user-auth-session-repository.port.js';
import type { UserAuthSessionInput, UserSessionRecord } from '../types/user-session.types.js';

/** 使用 TypeORM 保存用户刷新会话。 */
@Injectable()
export class TypeOrmUserAuthSessionRepository implements UserAuthSessionRepository {
  /** 创建当前实例。 */
  constructor(@InjectRepository(UserSessionEntity) private readonly sessions: Repository<UserSessionEntity>) {}

  /** 按刷新令牌摘要查询会话。 */
  async findByTokenHash(tokenHash: string): Promise<UserSessionRecord | null> {
    const item = await this.sessions.findOne({ where: { tokenHash } });
    return item ? this.toRecord(item) : null;
  }

  /** 创建会话。 */
  async create(input: UserAuthSessionInput): Promise<UserSessionRecord> {
    const item = await this.sessions.save(
      this.sessions.create({
        ...input,
        revokedAt: null,
        replacedBySessionId: null,
        lastUsedAt: null
      })
    );
    return this.toRecord(item);
  }

  /** 轮换会话。 */
  async rotate(
    sessionId: string,
    replacement: UserAuthSessionInput,
    now: Date
  ): Promise<{ status: 'rotated'; session: UserSessionRecord } | { status: 'missing' | 'expired' | 'replayed' }> {
    return this.sessions.manager.transaction(async manager => {
      const repository = manager.getRepository(UserSessionEntity);
      const current = await repository
        .createQueryBuilder('session')
        .setLock('pessimistic_write')
        .where('session.id = :id', { id: sessionId })
        .getOne();
      if (!current) return { status: 'missing' };
      if (current.revokedAt) return { status: 'replayed' };
      if (current.expiresAt <= now) {
        current.revokedAt = now;
        current.lastUsedAt = now;
        await repository.save(current);
        return { status: 'expired' };
      }
      const next = await repository.save(
        repository.create({
          ...replacement,
          revokedAt: null,
          replacedBySessionId: null,
          lastUsedAt: null
        })
      );
      current.revokedAt = now;
      current.lastUsedAt = now;
      current.replacedBySessionId = next.id;
      await repository.save(current);
      return { status: 'rotated', session: this.toRecord(next) };
    });
  }

  /** 按令牌摘要撤销会话。 */
  async revokeByTokenHash(tokenHash: string, now: Date): Promise<boolean> {
    const item = await this.sessions.findOne({ where: { tokenHash } });
    if (!item) return false;
    if (item.revokedAt) return true;
    item.revokedAt = now;
    item.lastUsedAt = now;
    await this.sessions.save(item);
    return true;
  }

  /** 撤销当前会话及其后续会话。 */
  async revokeChain(sessionId: string, now: Date): Promise<void> {
    let item = await this.sessions.findOne({ where: { id: sessionId } });
    while (item) {
      if (!item.revokedAt) {
        item.revokedAt = now;
        item.lastUsedAt = now;
        await this.sessions.save(item);
      }
      item = item.replacedBySessionId ? await this.sessions.findOne({ where: { id: item.replacedBySessionId } }) : null;
    }
  }

  /** 将实体转换为领域记录。 */
  private toRecord(item: UserSessionEntity): UserSessionRecord {
    return {
      id: String(item.id),
      userId: String(item.userId),
      tokenHash: item.tokenHash,
      expiresAt: item.expiresAt,
      revokedAt: item.revokedAt,
      replacedBySessionId: item.replacedBySessionId,
      createdAt: item.createdAt,
      lastUsedAt: item.lastUsedAt
    };
  }
}
