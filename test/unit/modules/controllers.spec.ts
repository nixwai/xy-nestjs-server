import { describe, expect, it, vi } from 'vitest';
import { AdminController } from '../../../src/modules/admin/admin.controller.js';
import { RoleController } from '../../../src/modules/role/role.controller.js';
import { PermissionController } from '../../../src/modules/permission/permission.controller.js';
import { AuditController } from '../../../src/modules/audit/audit.controller.js';
import { AuthController } from '../../../src/modules/auth/auth.controller.js';
import { HealthController } from '../../../src/modules/health/health.controller.js';

const admin = { sub: 'admin-1' } as never;
const body = {} as never;

describe('AdminController', () => {
  const service = {
    getMe: vi.fn().mockResolvedValue({ id: '1' }),
    listAdmins: vi.fn().mockResolvedValue([{ id: '1' }]),
    createAdmin: vi.fn().mockResolvedValue({ id: '1' }),
    updateAdmin: vi.fn().mockResolvedValue({ id: '1' }),
    removeAdmin: vi.fn().mockResolvedValue(null),
    bindRole: vi.fn().mockResolvedValue(null),
    unbindRole: vi.fn().mockResolvedValue(null),
  };
  const controller = new AdminController(service as never);

  it('应代理管理员查询和写操作', async () => {
    await controller.me(admin);
    await controller.list(body);
    await controller.create(admin, body);
    await controller.update(admin, body);
    await controller.remove(admin, body);
    await controller.bindRole(admin, body);
    await controller.unbindRole(admin, body);

    expect(service.getMe).toHaveBeenCalledWith('admin-1');
    expect(service.listAdmins).toHaveBeenCalled();
    expect(service.createAdmin).toHaveBeenCalledWith('admin-1', body);
    expect(service.updateAdmin).toHaveBeenCalledWith('admin-1', body);
    expect(service.removeAdmin).toHaveBeenCalled();
    expect(service.bindRole).toHaveBeenCalled();
    expect(service.unbindRole).toHaveBeenCalled();
  });
});

describe('RoleController', () => {
  const service = {
    listRoles: vi.fn().mockResolvedValue([{ id: '1' }]),
    createRole: vi.fn().mockResolvedValue({ id: '1' }),
    updateRole: vi.fn().mockResolvedValue({ id: '1' }),
    removeRole: vi.fn().mockResolvedValue(undefined),
    bindPermission: vi.fn().mockResolvedValue(undefined),
    unbindPermission: vi.fn().mockResolvedValue(undefined),
  };
  const controller = new RoleController(service as never);

  it('应代理角色和权限关系操作', async () => {
    await controller.list();
    await controller.create(admin, body);
    await controller.update(admin, body);
    await controller.remove(admin, body);
    await controller.bindPermission(admin, body);
    await controller.unbindPermission(admin, body);

    expect(service.listRoles).toHaveBeenCalled();
    expect(service.createRole).toHaveBeenCalled();
    expect(service.updateRole).toHaveBeenCalled();
    expect(service.removeRole).toHaveBeenCalled();
    expect(service.bindPermission).toHaveBeenCalled();
    expect(service.unbindPermission).toHaveBeenCalled();
  });
});

describe('PermissionController', () => {
  const service = {
    listPermissions: vi.fn().mockResolvedValue([{ id: '1' }]),
    setActive: vi.fn().mockResolvedValue({ id: '1' }),
  };
  const controller = new PermissionController(service as never);

  it('应代理权限列表和状态操作', async () => {
    await controller.list();
    await controller.enable(admin, body);
    await controller.disable(admin, body);

    expect(service.listPermissions).toHaveBeenCalled();
    expect(service.setActive).toHaveBeenNthCalledWith(
      1,
      'admin-1',
      undefined,
      true,
    );
    expect(service.setActive).toHaveBeenNthCalledWith(
      2,
      'admin-1',
      undefined,
      false,
    );
  });
});

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

describe('AuthController', () => {
  it('应代理认证接口', async () => {
    const service = {
      login: vi.fn().mockResolvedValue({ accessToken: 'a' }),
      refresh: vi.fn().mockResolvedValue({ accessToken: 'b' }),
      logout: vi.fn().mockResolvedValue(null),
    };
    const controller = new AuthController(service as never);

    await controller.login({ username: 'admin', password: 'Admin1234' });
    await controller.refresh({ refreshToken: 'refresh' });
    await controller.logout({ refreshToken: 'refresh' });

    expect(service.login).toHaveBeenCalledWith('admin', 'Admin1234');
    expect(service.refresh).toHaveBeenCalledWith('refresh');
    expect(service.logout).toHaveBeenCalledWith('refresh');
  });
});

describe('HealthController', () => {
  it('应返回存活和就绪状态', async () => {
    const service = {
      getHealth: vi.fn().mockReturnValue({ status: 'ok' }),
      getReadiness: vi.fn().mockResolvedValue({ status: 'ready' }),
    };
    const controller = new HealthController(service as never);

    expect(controller.getHealth()).toEqual({ status: 'ok' });
    await expect(controller.getReadiness()).resolves.toEqual({
      status: 'ready',
    });
  });
});
