import { describe, expect, it, vi } from 'vitest';
import { PermissionController } from '#/modules/permission/permission.controller.js';

const admin = { sub: 'admin-1' } as never;
const body = {} as never;
const groups = [{ category: 'system', categoryName: '系统管理', permissions: [{ id: '1' }] }];

describe('PermissionController', () => {
  const service = {
    listPermissionGroups: vi.fn().mockResolvedValue(groups),
    listAssignablePermissionGroups: vi.fn().mockResolvedValue(groups),
    setActive: vi.fn().mockResolvedValue({ id: '1' })
  };
  const controller = new PermissionController(service as never);

  it('应代理权限分组列表和状态操作', async () => {
    await expect(controller.list()).resolves.toEqual({ groups, total: 1 });
    await expect(controller.listAssignable()).resolves.toEqual({ groups, total: 1 });
    await controller.enable(admin, body);
    await controller.disable(admin, body);

    expect(service.listPermissionGroups).toHaveBeenCalled();
    expect(service.listAssignablePermissionGroups).toHaveBeenCalled();
    expect(service.setActive).toHaveBeenNthCalledWith(1, 'admin-1', undefined, true);
    expect(service.setActive).toHaveBeenNthCalledWith(2, 'admin-1', undefined, false);
  });
});
