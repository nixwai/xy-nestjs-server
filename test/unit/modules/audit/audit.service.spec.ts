import { describe, expect, it, vi } from 'vitest';
import { AuditService } from '#/modules/audit/audit.service.js';
import { AuditLogListQueryDto } from '#/modules/audit/dto/index.js';
/** 查询参数。 */
function query(overrides: Partial<AuditLogListQueryDto> = {}) {
  return Object.assign(new AuditLogListQueryDto(), overrides);
}

describe('AuditService', () => {
  it('无数据库连接时应按稳定顺序返回游标分页结果', async () => {
    const service = new AuditService();

    await service.record({
      actorAdminId: 'admin-1',
      action: 'admin.create',
      resourceType: 'admin',
      targetId: '1'
    });
    await service.record({
      actorAdminId: null,
      action: 'admin.soft-delete',
      resourceType: 'admin',
      succeeded: false
    });

    const first = await service.list(query({ limit: 1 }));
    expect(first.items).toHaveLength(1);
    expect(first.items[0]).toMatchObject({
      action: 'admin.soft-delete',
      actionLabel: '删除管理员',
      resourceTypeLabel: '管理员',
      succeeded: false
    });
    expect(first.hasMore).toBe(true);
    expect(first.nextCursor).toBeTruthy();

    const second = await service.list(query({ limit: 1, cursor: first.nextCursor! }));
    expect(second.items).toHaveLength(1);
    expect(second.items[0]).toMatchObject({
      action: 'admin.create',
      actionLabel: '创建管理员',
      targetId: '1'
    });
    expect(second.hasMore).toBe(false);
    expect(second.nextCursor).toBeNull();
  });

  it('未知动作和资源编码应回退为原始编码', async () => {
    const service = new AuditService();
    await service.record({ actorAdminId: null, action: 'unknown.action', resourceType: 'unknown-resource' });
    const result = await service.list(query({ limit: 1 }));
    expect(result.items[0]).toMatchObject({ actionLabel: 'unknown.action', resourceTypeLabel: 'unknown-resource' });
  });

  it('非法游标应拒绝查询', async () => {
    const service = new AuditService();
    await expect(service.list(query({ cursor: 'invalid' }))).rejects.toMatchObject({
      message: '游标格式不正确'
    });
  });

  it('数据库已初始化时应使用 QueryBuilder 游标查询', async () => {
    const save = vi.fn().mockResolvedValue(undefined);
    const create = vi.fn(payload => payload);
    const getMany = vi.fn().mockResolvedValue([]);
    const builder = {
      orderBy: vi.fn().mockReturnThis(),
      addOrderBy: vi.fn().mockReturnThis(),
      take: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      getMany
    };
    const dataSource = {
      isInitialized: true,
      getRepository: vi.fn().mockReturnValue({
        save,
        create,
        createQueryBuilder: vi.fn().mockReturnValue(builder)
      })
    } as never;
    const service = new AuditService(dataSource);

    await service.record({
      actorAdminId: 'admin-1',
      action: 'db.record',
      resourceType: 'admin'
    });
    await expect(service.list(query({ limit: 10 }))).resolves.toEqual({
      items: [],
      nextCursor: null,
      hasMore: false
    });
    expect(save).toHaveBeenCalled();
    expect(builder.take).toHaveBeenCalledWith(11);
    expect(getMany).toHaveBeenCalled();
  });

  it('数据库游标查询应添加边界条件', async () => {
    const cursor = Buffer.from(JSON.stringify({ createdAt: '2026-01-01T00:00:00.000Z', id: '10' })).toString(
      'base64url'
    );
    const builder = {
      orderBy: vi.fn().mockReturnThis(),
      addOrderBy: vi.fn().mockReturnThis(),
      take: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      getMany: vi.fn().mockResolvedValue([])
    };
    const dataSource = {
      isInitialized: true,
      getRepository: vi.fn().mockReturnValue({
        createQueryBuilder: vi.fn().mockReturnValue(builder)
      })
    } as never;
    const service = new AuditService(dataSource);

    await service.list(query({ limit: 5, cursor }));
    expect(builder.where).toHaveBeenCalledWith(
      '(audit.createdAt < :createdAt OR (audit.createdAt = :createdAt AND audit.id < :id))',
      expect.objectContaining({ id: '10' })
    );
  });
});
