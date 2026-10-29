import { describe, expect, it, vi } from 'vitest';
import { AuditController } from '../../../../src/modules/audit/audit.controller.js';

const admin = { sub: 'admin-1' } as never;

describe('AuditController', () => {
  it('应返回审计列表和总数', async () => {
    const service = { list: vi.fn().mockResolvedValue([{ id: '1' }]) };
    const controller = new AuditController(service as never);

    await expect(controller.list(admin)).resolves.toEqual({
      items: [{ id: '1' }],
      total: 1,
    });
  });
});
