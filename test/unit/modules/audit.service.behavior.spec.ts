import { describe, expect, it } from 'vitest';
import { AuditService } from '#/modules/audit/audit.service.js';

describe('审计日志游标查询', () => {
  it('记录成功和失败操作，并按游标分页返回稳定响应', async () => {
    const service = new AuditService();
    await service.record({ actorAdminId: 'admin-1', action: 'admin.create', resourceType: 'admin', targetId: '1' });
    await service.record({
      actorAdminId: 'admin-1',
      action: 'admin.update',
      resourceType: 'admin',
      targetId: '1',
      succeeded: false
    });

    const first = await service.list({ limit: 1 });
    expect(first.items).toHaveLength(1);
    expect(first.hasMore).toBe(true);
    expect(first.nextCursor).toEqual(expect.any(String));
    expect(first.items[0]).toHaveProperty('actionLabel');

    const second = await service.list({ limit: 1, cursor: first.nextCursor! });
    expect(second.items).toHaveLength(1);
    expect(second.items[0].id).not.toBe(first.items[0].id);
    expect(second.hasMore).toBe(false);
  });

  it('拒绝非法游标而不返回任意记录', async () => {
    const service = new AuditService();

    await expect(service.list({ limit: 20, cursor: 'not-a-cursor' })).rejects.toThrow('游标格式不正确');
  });

  it('数据库已初始化时通过 TypeORM 仓储写入和按游标查询', async () => {
    const saved: unknown[] = [];
    const records = [
      {
        id: '2',
        actorAdminId: 'admin-1',
        action: 'admin.update',
        resourceType: 'admin',
        targetId: '2',
        details: null,
        succeeded: true,
        createdAt: new Date('2026-01-02T00:00:00.000Z'),
        updatedAt: new Date('2026-01-02T00:00:00.000Z')
      },
      {
        id: '1',
        actorAdminId: 'admin-1',
        action: 'admin.create',
        resourceType: 'admin',
        targetId: '1',
        details: null,
        succeeded: true,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-01T00:00:00.000Z')
      }
    ];
    const builder = {
      orderBy: () => builder,
      addOrderBy: () => builder,
      take: () => builder,
      where: () => builder,
      getMany: async () => records
    };
    const repository = {
      create: (payload: unknown) => payload,
      save: async (payload: unknown) => {
        saved.push(payload);
        return payload;
      },
      createQueryBuilder: () => builder
    };
    const service = new AuditService({ isInitialized: true, getRepository: () => repository } as never);

    await service.record({ actorAdminId: 'admin-1', action: 'admin.create', resourceType: 'admin', targetId: '1' });
    expect(saved).toHaveLength(1);
    const result = await service.list({ limit: 1 });
    expect(result.items).toHaveLength(1);
    expect(result.hasMore).toBe(true);
  });
});
