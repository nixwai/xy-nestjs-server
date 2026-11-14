import { describe, expect, it, vi } from 'vitest';
import { RoleController } from '#/modules/role/role.controller.js';

const admin = { sub: 'admin-1' } as never;
const permissionIds = ['permission-1', 'permission-invalid'];
const body = { roleId: 'role-1', permissionIds } as never;

describe('RoleController', () => {
  const service = {
    listRoles: vi.fn().mockResolvedValue({ items: [{ id: '1' }], total: 1 }),
    createRole: vi.fn().mockResolvedValue({ id: '1' }),
    updateRole: vi.fn().mockResolvedValue({ id: '1' }),
    softDeleteRole: vi.fn().mockResolvedValue(undefined),
    bindPermissions: vi.fn().mockResolvedValue(undefined),
    unbindPermissions: vi.fn().mockResolvedValue(undefined)
  };
  const controller = new RoleController(service as never);

  it('应代理角色和权限关系操作', async () => {
    await controller.list();
    await controller.create(admin, body);
    await controller.update(admin, body);
    await controller.softDelete(admin, body);
    await controller.bindPermissions(admin, body);
    await controller.unbindPermissions(admin, body);

    expect(service.listRoles).toHaveBeenCalled();
    expect(service.createRole).toHaveBeenCalled();
    expect(service.updateRole).toHaveBeenCalled();
    expect(service.softDeleteRole).toHaveBeenCalled();
    expect(service.bindPermissions).toHaveBeenCalledWith('admin-1', 'role-1', permissionIds);
    expect(service.unbindPermissions).toHaveBeenCalledWith('admin-1', 'role-1', permissionIds);
  });
});
