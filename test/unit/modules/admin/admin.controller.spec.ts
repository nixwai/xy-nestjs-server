import { describe, expect, it, vi } from 'vitest';
import { AdminController } from '#/modules/admin/admin.controller.js';

const admin = { sub: 'admin-1' } as never;
const body = {
  id: '2',
  username: 'operator',
  password: 'ciphertext',
  currentPassword: 'ciphertext'
} as never;

describe('AdminController', () => {
  const service = {
    getMe: vi.fn().mockResolvedValue({ id: '1' }),
    listAdmins: vi.fn().mockResolvedValue([{ id: '1' }]),
    createAdmin: vi.fn().mockResolvedValue({ id: '1' }),
    updateAdmin: vi.fn().mockResolvedValue({ id: '1' }),
    softDeleteAdmin: vi.fn().mockResolvedValue(null),
    bindRole: vi.fn().mockResolvedValue(null),
    unbindRole: vi.fn().mockResolvedValue(null),
    resetAdminPassword: vi.fn().mockResolvedValue({ id: '1' })
  };
  const authorizationQuery = { getAuthorization: vi.fn().mockResolvedValue({ permissions: [], menus: [] }) };
  const passwordTransport = {
    decryptPassword: vi.fn().mockReturnValue('Admin1234'),
    decryptOptionalPassword: vi.fn().mockReturnValue('Admin1234')
  };
  const controller = new AdminController(service as never, authorizationQuery as never, passwordTransport as never);

  it('应代理管理员查询和写操作', async () => {
    await controller.me(admin);
    await controller.list(body);
    await controller.resetPassword(admin, body);
    await controller.create(admin, body);
    await controller.update(admin, body);
    await controller.softDelete(admin, body);
    await controller.bindRole(admin, body);
    await controller.unbindRole(admin, body);

    expect(service.getMe).toHaveBeenCalledWith('admin-1');
    expect(service.listAdmins).toHaveBeenCalled();
    expect(service.resetAdminPassword).toHaveBeenCalled();
    expect(service.createAdmin).toHaveBeenCalledWith('admin-1', expect.objectContaining({ password: 'Admin1234' }));
    expect(service.updateAdmin).toHaveBeenCalledWith('admin-1', expect.objectContaining({ password: 'Admin1234' }));
    expect(service.softDeleteAdmin).toHaveBeenCalled();
    expect(service.bindRole).toHaveBeenCalled();
    expect(service.unbindRole).toHaveBeenCalled();
  });
});
