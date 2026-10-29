import { describe, expect, it, vi } from 'vitest';
import { AuditService } from '../../../../src/modules/audit/audit.service.js';

describe('AuditService', () => {
  it('无数据库连接时应写入内存并按倒序返回', async () => {
    const service = new AuditService();

    await service.record({
      actorAdminId: 'admin-1',
      action: 'admin.create',
      resourceType: 'admin',
      targetId: '1',
    });
    await service.record({
      actorAdminId: null,
      action: 'admin.remove',
      resourceType: 'admin',
      succeeded: false,
    });

    const records = await service.list();
    expect(records).toHaveLength(2);
    expect(records[0]).toMatchObject({
      action: 'admin.remove',
      succeeded: false,
    });
    expect(records[1]).toMatchObject({ action: 'admin.create', targetId: '1' });
  });

  it('数据库已初始化时应使用数据库仓储', async () => {
    const save = vi.fn().mockResolvedValue(undefined);
    const find = vi.fn().mockResolvedValue([{ action: 'db.record' }]);
    const create = vi.fn((payload) => payload);
    const dataSource = {
      isInitialized: true,
      getRepository: vi.fn().mockReturnValue({ save, find, create }),
    } as never;
    const service = new AuditService(dataSource);

    await service.record({
      actorAdminId: 'admin-1',
      action: 'db.record',
      resourceType: 'admin',
    });
    await expect(service.list()).resolves.toEqual([{ action: 'db.record' }]);
    expect(save).toHaveBeenCalled();
    expect(find).toHaveBeenCalledWith({ order: { createdAt: 'DESC' } });
  });
});
