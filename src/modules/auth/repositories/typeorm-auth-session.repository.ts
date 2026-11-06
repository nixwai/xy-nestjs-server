import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import { AdminSessionEntity } from '#/modules/admin/entities/admin-session.entity.js';
import type { AuthSessionRepository } from './auth-session-repository.port.js';
import type { AdminSessionRecord, AuthSessionInput, SessionRotationResult } from '../types/session.types.js';
/** 使用 TypeORM 保存刷新会话。 */
@Injectable()
export class TypeOrmAuthSessionRepository implements AuthSessionRepository {
  /** 创建当前实例。 */
  constructor(
    @InjectRepository(AdminSessionEntity)
    private readonly sessions: Repository<AdminSessionEntity>
  ) {}

  /** findByTokenHash。 */
  async findByTokenHash(tokenHash: string): Promise<AdminSessionRecord | null> {
    const item = await this.sessions.findOne({ where: { tokenHash } });
    return item ? this.toRecord(item) : null;
  }

  /** 创建记录 */
  async create(input: AuthSessionInput): Promise<AdminSessionRecord> {
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

  /** rotate。 */
  async rotate(sessionId: string, replacement: AuthSessionInput, now: Date): Promise<SessionRotationResult> {
    return this.sessions.manager.transaction(async manager => {
      const repository = manager.getRepository(AdminSessionEntity);
      const current = await repository
        .createQueryBuilder('session')
        .setLock('pessimistic_write')
        .where('session.id = :id', { id: sessionId })
        .getOne();
      if (!current) {
        return { status: 'missing' };
      }
      if (current.revokedAt) {
        return { status: 'replayed' };
      }
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

  /** revokeByTokenHash。 */
  async revokeByTokenHash(tokenHash: string, now: Date): Promise<boolean> {
    const item = await this.sessions.findOne({ where: { tokenHash } });
    if (!item) {
      return false;
    }
    if (item.revokedAt) {
      return true;
    }
    item.revokedAt = now;
    item.lastUsedAt = now;
    await this.sessions.save(item);
    return true;
  }

  /** revokeChain。 */
  async revokeChain(sessionId: string, now: Date): Promise<void> {
    let item = await this.sessions.findOne({ where: { id: sessionId } });
    while (item) {
      if (!item.revokedAt) {
        item.revokedAt = now;
        item.lastUsedAt = now;
        await this.sessions.save(item);
      }
      item = item.replacedBySessionId
        ? await this.sessions.findOne({
            where: { id: item.replacedBySessionId }
          })
        : null;
    }
  }

  /** 将实体转换为领域记录 */
  private toRecord(item: AdminSessionEntity): AdminSessionRecord {
    return {
      id: String(item.id),
      adminId: String(item.adminId),
      tokenHash: item.tokenHash,
      expiresAt: item.expiresAt,
      revokedAt: item.revokedAt,
      replacedBySessionId: item.replacedBySessionId,
      createdAt: item.createdAt,
      lastUsedAt: item.lastUsedAt
    };
  }
}
