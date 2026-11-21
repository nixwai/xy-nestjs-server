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

  /** 按会话族撤销所有刷新会话。 */
  async revokeBySessionFamilyId(sessionFamilyId: string, now: Date): Promise<void> {
    await this.sessions.manager.transaction(async manager => {
      await manager
        .getRepository(UserSessionEntity)
        .createQueryBuilder()
        .update(UserSessionEntity)
        .set({ revokedAt: now, lastUsedAt: now })
        .where('session_family_id = :sessionFamilyId', { sessionFamilyId })
        .andWhere('revoked_at IS NULL')
        .execute();
    });
  }

  /** 删除已失效且超过保留期的会话族。 */
  async deleteExpiredFamilies(now: Date, cutoff: Date, limit: number): Promise<number> {
    if (limit <= 0) {
      return 0;
    }
    const families = await this.sessions
      .createQueryBuilder('session')
      .select('session.sessionFamilyId', 'sessionFamilyId')
      .groupBy('session.sessionFamilyId')
      .having('MAX(session.expiresAt) <= :cutoff', { cutoff })
      .andHaving('SUM(CASE WHEN session.revokedAt IS NULL AND session.expiresAt > :now THEN 1 ELSE 0 END) = 0', { now })
      .limit(limit)
      .getRawMany<{ sessionFamilyId: string }>();
    const familyIds = families.map(item => item.sessionFamilyId).filter(Boolean);
    if (familyIds.length === 0) {
      return 0;
    }
    const result = await this.sessions
      .createQueryBuilder()
      .delete()
      .from(UserSessionEntity)
      .where('session_family_id IN (:...familyIds)', { familyIds })
      .execute();
    return result.affected ?? 0;
  }

  /** 将实体转换为领域记录。 */
  private toRecord(item: UserSessionEntity): UserSessionRecord {
    return {
      id: String(item.id),
      userId: String(item.userId),
      sessionFamilyId: item.sessionFamilyId,
      tokenHash: item.tokenHash,
      expiresAt: item.expiresAt,
      revokedAt: item.revokedAt,
      replacedBySessionId: item.replacedBySessionId,
      createdAt: item.createdAt,
      lastUsedAt: item.lastUsedAt
    };
  }
}
