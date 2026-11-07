import { BadRequestException, Inject, Injectable, Optional } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { decodeCursor, encodeCursor } from '#/common/utils/index.js';
import type { CursorPageResult } from '#/common/types/index.js';
import { CursorPageQueryDto } from '#/common/dto/index.js';
import type { AuditLogCursor, AuditLogResponse, AuditRecordInput } from './types/audit.types.js';
import { getAuditActionLabel, getAuditResourceLabel } from './constants/audit-labels.constant.js';
import type { AuditLogListQueryDto } from './dto/index.js';
import { AuditLogEntity } from './entities/audit-log.entity.js';
/** 记录和查询管理员操作审计。 */
@Injectable()
export class AuditService {
  /** 内存中的审计记录。 */
  private readonly memory: AuditLogEntity[] = [];
  /** 创建当前实例。 */
  constructor(@Optional() @Inject(DataSource) private readonly dataSource?: DataSource) {}

  /** 写入不包含敏感字段的审计记录。 */
  async record(input: AuditRecordInput): Promise<void> {
    const payload = {
      actorAdminId: input.actorAdminId,
      action: input.action,
      resourceType: input.resourceType,
      targetId: input.targetId ?? null,
      details: input.details ?? null,
      succeeded: input.succeeded ?? true
    };
    if (this.dataSource?.isInitialized) {
      const repository = this.dataSource.getRepository(AuditLogEntity);
      await repository.save(repository.create(payload));
      return;
    }
    const record = Object.assign(new AuditLogEntity(), payload, {
      id: String(this.memory.length + 1),
      createdAt: new Date(),
      updatedAt: new Date()
    });
    this.memory.push(record);
  }

  /** 按创建时间和 ID 倒序查询审计记录。 */
  async list(query: AuditLogListQueryDto = new CursorPageQueryDto()): Promise<CursorPageResult<AuditLogResponse>> {
    const cursor = query.cursor ? this.parseCursor(query.cursor) : null;
    if (this.dataSource?.isInitialized) {
      const repository = this.dataSource.getRepository(AuditLogEntity);
      const builder = repository
        .createQueryBuilder('audit')
        .orderBy('audit.createdAt', 'DESC')
        .addOrderBy('audit.id', 'DESC')
        .take(query.limit + 1);
      if (cursor) {
        builder.where('(audit.createdAt < :createdAt OR (audit.createdAt = :createdAt AND audit.id < :id))', cursor);
      }
      const records = await builder.getMany();
      return this.toCursorResult(records, query.limit);
    }

    const records = [...this.memory]
      .filter(item => this.isAfterCursor(item, cursor))
      .sort(
        (left, right) =>
          right.createdAt.getTime() - left.createdAt.getTime() || Number(BigInt(right.id) - BigInt(left.id))
      )
      .slice(0, query.limit + 1);
    return this.toCursorResult(records, query.limit);
  }

  /** parseCursor。 */
  private parseCursor(value: string): AuditLogCursor {
    const payload = decodeCursor(value);
    const createdAt = payload?.createdAt ? new Date(payload.createdAt) : null;
    const id = payload?.id;
    if (!createdAt || Number.isNaN(createdAt.getTime()) || !id || !/^\d+$/.test(id)) {
      throw new BadRequestException('游标格式不正确');
    }
    return { createdAt, id };
  }

  /** isAfterCursor。 */
  private isAfterCursor(item: AuditLogEntity, cursor: AuditLogCursor | null): boolean {
    if (!cursor) {
      return true;
    }
    return (
      item.createdAt.getTime() < cursor.createdAt.getTime() ||
      (item.createdAt.getTime() === cursor.createdAt.getTime() && BigInt(item.id) < BigInt(cursor.id))
    );
  }

  /** toCursorResult。 */
  private toCursorResult(records: AuditLogEntity[], limit: number): CursorPageResult<AuditLogResponse> {
    const hasMore = records.length > limit;
    const items = records.slice(0, limit).map(item => this.toResponse(item));
    const last = items.at(-1);
    return {
      items,
      hasMore,
      nextCursor:
        hasMore && last
          ? encodeCursor({
              createdAt: last.createdAt.toISOString(),
              id: String(last.id)
            })
          : null
    };
  }

  /** 将审计实体转换为接口响应，避免直接暴露持久化实体。 */
  private toResponse(item: AuditLogEntity): AuditLogResponse {
    return {
      id: String(item.id),
      actorAdminId: item.actorAdminId,
      action: item.action,
      actionLabel: getAuditActionLabel(item.action),
      resourceType: item.resourceType,
      resourceTypeLabel: getAuditResourceLabel(item.resourceType),
      targetId: item.targetId,
      details: item.details,
      succeeded: item.succeeded,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt
    };
  }
}
