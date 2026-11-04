import { describe, expect, it, vi } from 'vitest';
import { AdminAuthorizationQueryService } from '#/modules/admin/authorization-query.service.js';

const admin = {
  id: '1',
  username: 'operator',
  isActive: true,
  isRoot: false,
  roleIds: ['role-1'],
  createdAt: new Date(),
  updatedAt: new Date()
};

function createService() {
  const roles = {
    findByIds: vi.fn().mockResolvedValue([{ id: 'role-1', isActive: true, permissionIds: ['1'] }])
  };
  const permissions = {
    findByIds: vi.fn().mockResolvedValue([
      { id: '1', code: 'booking.read', isActive: true, isAssignable: true, isProtected: false },
      { id: '4', code: 'booking.write', isActive: false, isAssignable: true, isProtected: false }
    ]),
    listPermissions: vi.fn().mockResolvedValue([
      { id: '2', code: 'admin.account.read', isActive: true, isAssignable: false, isProtected: true },
      { id: '5', code: 'admin.account.write', isActive: false, isAssignable: false, isProtected: true }
    ])
  };
  const menus = {
    list: vi.fn().mockResolvedValue([
      {
        id: '1',
        parentId: null,
        title: '工作台',
        path: '/home',
        icon: null,
        order: 1,
        permissionCode: null,
        isRootOnly: false,
        isActive: true,
        deletedAt: null
      },
      {
        id: '2',
        parentId: null,
        title: '预约',
        path: '/booking',
        icon: null,
        order: 2,
        permissionCode: 'booking.read',
        isRootOnly: false,
        isActive: true,
        deletedAt: null
      },
      {
        id: '3',
        parentId: null,
        title: '系统',
        path: '/system',
        icon: null,
        order: 3,
        permissionCode: null,
        isRootOnly: true,
        isActive: true,
        deletedAt: null
      }
    ])
  };
  return {
    service: new AdminAuthorizationQueryService(roles as never, permissions as never, menus as never),
    roles,
    permissions
  };
}

describe('AdminAuthorizationQueryService', () => {
  it('应按动态权限和根管理员边界生成菜单与权限', async () => {
    const { service, permissions } = createService();
    const normal = await service.getAuthorization(admin);
    expect(normal.permissions).toEqual(['booking.read']);
    expect(normal.menus.map(item => item.path)).toEqual(['/home', '/booking']);

    const root = await service.getAuthorization({ ...admin, isRoot: true });
    expect(permissions.listPermissions).toHaveBeenCalled();
    expect(root.permissions).toEqual(['admin.account.read']);
    expect(root.menus.map(item => item.path)).toEqual(['/home', '/booking', '/system']);
  });
});
