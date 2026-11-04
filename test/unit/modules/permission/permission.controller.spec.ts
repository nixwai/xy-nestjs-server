import { describe, expect, it, vi } from 'vitest';
import { PermissionController } from '#/modules/permission/permission.controller.js';

const admin = { sub: 'admin-1' } as never;
const body = {} as never;

describe('PermissionController', () => {
  const service = {
    listPermissions: vi.fn().mockResolvedValue([{ id: '1' }]),
    listAssignablePermissions: vi.fn().mockResolvedValue([{ id: '1' }]),
    setActive: vi.fn().mockResolvedValue({ id: '1' })
  };
  const controller = new PermissionController(service as never);

  it('应代理权限列表和状态操作', async () => {
    await controller.list();
    await controller.enable(admin, body);
    await controller.disable(admin, body);

    expect(service.listPermissions).toHaveBeenCalled();
    expect(service.setActive).toHaveBeenNthCalledWith(1, 'admin-1', undefined, true);
    expect(service.setActive).toHaveBeenNthCalledWith(2, 'admin-1', undefined, false);
  });
});
