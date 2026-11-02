import { describe, expect, it, vi } from 'vitest';
import { RoleController } from '../../../../src/modules/role/role.controller.js';

const admin = { sub: 'admin-1' } as never;
const body = {} as never;

describe('RoleController', () => {
  const service = {
    listRoles: vi.fn().mockResolvedValue({ items: [{ id: '1' }], total: 1 }),
    createRole: vi.fn().mockResolvedValue({ id: '1' }),
    updateRole: vi.fn().mockResolvedValue({ id: '1' }),
    softDeleteRole: vi.fn().mockResolvedValue(undefined),
    bindPermission: vi.fn().mockResolvedValue(undefined),
    unbindPermission: vi.fn().mockResolvedValue(undefined),
  };
  const controller = new RoleController(service as never);

  it('应代理角色和权限关系操作', async () => {
    await controller.list();
    await controller.create(admin, body);
    await controller.update(admin, body);
    await controller.softDelete(admin, body);
    await controller.bindPermission(admin, body);
    await controller.unbindPermission(admin, body);

    expect(service.listRoles).toHaveBeenCalled();
    expect(service.createRole).toHaveBeenCalled();
    expect(service.updateRole).toHaveBeenCalled();
    expect(service.softDeleteRole).toHaveBeenCalled();
    expect(service.bindPermission).toHaveBeenCalled();
    expect(service.unbindPermission).toHaveBeenCalled();
  });
});
