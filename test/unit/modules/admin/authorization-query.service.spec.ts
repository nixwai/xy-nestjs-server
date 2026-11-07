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
/** 构造测试服务及其依赖 */
function createService() {
  const roles = {
    findByIds: vi.fn().mockResolvedValue([{ id: 'role-1', isActive: true, permissionIds: ['1'] }])
  };
  const permissions = {
    findByIds: vi.fn().mockResolvedValue([
      { id: '1', code: 'resource.read', isActive: true, isAssignable: true, isProtected: false },
      { id: '4', code: 'resource.write', isActive: false, isAssignable: true, isProtected: false }
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
        menuKey: 'home',
        parentKey: null,
        title: '工作台',
        path: '/home',
        order: 1,
        permissionCode: null,
        isRootOnly: false,
        isActive: true,
        permissionAvailable: true
      },
      {
        id: '2',
        menuKey: 'resource',
        parentKey: null,
        title: '资源',
        path: '/resource',
        order: 2,
        permissionCode: 'resource.read',
        isRootOnly: false,
        isActive: true,
        permissionAvailable: true
      },
      {
        id: '3',
        menuKey: 'system',
        parentKey: null,
        title: '系统',
        path: '/system',
        order: 3,
        permissionCode: null,
        isRootOnly: true,
        isActive: true,
        permissionAvailable: true
      },
      {
        id: '4',
        menuKey: 'system-admin',
        parentKey: 'system',
        title: '系统管理员',
        path: '/system/admin',
        order: 1,
        permissionCode: null,
        isRootOnly: true,
        isActive: true,
        permissionAvailable: true
      },
      {
        id: '5',
        menuKey: 'report',
        parentKey: null,
        title: '报表',
        path: '/report',
        order: 4,
        permissionCode: null,
        isRootOnly: false,
        isActive: true,
        permissionAvailable: true
      },
      {
        id: '6',
        menuKey: 'report-daily',
        parentKey: 'report',
        title: '日报',
        path: '/report/daily',
        order: 1,
        permissionCode: 'report.read',
        isRootOnly: false,
        isActive: true,
        permissionAvailable: false
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
    expect(normal.permissions).toEqual(['resource.read']);
    expect(normal.menus.map(item => item.path)).toEqual(['/home', '/resource']);

    const root = await service.getAuthorization({ ...admin, isRoot: true });
    expect(permissions.listPermissions).toHaveBeenCalled();
    expect(root.permissions).toEqual(['admin.account.read']);
    expect(root.menus.map(item => item.path)).toEqual(['/home', '/system']);
    expect(root.menus[1].children?.map(item => item.path)).toEqual(['/system/admin']);
  });
});
