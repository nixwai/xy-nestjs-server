import { describe, expect, it, vi } from 'vitest';
import { AuditController } from '../../../../src/modules/audit/audit.controller.js';
import { AuditLogListQueryDto } from '../../../../src/modules/audit/dto/index.js';

const admin = { sub: 'admin-1' } as never;

describe('AuditController', () => {
  it('应代理审计游标分页查询', async () => {
    const result = { items: [{ id: '1' }], nextCursor: null, hasMore: false };
    const service = { list: vi.fn().mockResolvedValue(result) };
    const controller = new AuditController(service as never);
    const query = new AuditLogListQueryDto();

    await expect(controller.list(admin, query)).resolves.toEqual(result);
    expect(service.list).toHaveBeenCalledWith(query);
  });
});
