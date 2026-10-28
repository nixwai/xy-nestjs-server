import { Injectable } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AuditLogEntity } from './entities/audit-log.entity.js';

/** 记录和查询管理员操作审计。 */
@Injectable()
export class AuditService {
  private readonly memory: AuditLogEntity[] = [];
  constructor(@Inject(DataSource) private readonly dataSource?: DataSource) {}
  /** 写入不包含敏感字段的审计记录。 */
  async record(input: {
    actorAdminId: string | null;
    action: string;
    resourceType: string;
    targetId?: string;
    details?: Record<string, unknown>;
    succeeded?: boolean;
  }): Promise<void> {
    const payload = {
      actorAdminId: input.actorAdminId,
      action: input.action,
      resourceType: input.resourceType,
      targetId: input.targetId ?? null,
      details: input.details ?? null,
      succeeded: input.succeeded ?? true,
    };
    if (this.dataSource?.isInitialized) {
      const repository = this.dataSource.getRepository(AuditLogEntity);
      await repository.save(repository.create(payload));
      return;
    }
    const record = Object.assign(new AuditLogEntity(), payload, {
      createdAt: new Date(),
    });
    this.memory.push(record);
  }
  /** 查询审计记录。 */
  async list(): Promise<AuditLogEntity[]> {
    if (this.dataSource?.isInitialized) {
      return this.dataSource
        .getRepository(AuditLogEntity)
        .find({ order: { createdAt: 'DESC' } });
    }

    return [...this.memory].reverse();
  }
}
