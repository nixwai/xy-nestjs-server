import { describe, expect, it, vi } from 'vitest';
import { AuthorizationService } from '#/modules/authorization/authorization.service.js';
import type { AdminService } from '#/modules/admin/admin.service.js';
import type { RoleService } from '#/modules/role/role.service.js';
import type { PermissionService } from '#/modules/permission/permission.service.js';
import { DomainNotFoundError } from '#/common/errors/index.js';

const admin = {
  id: 'admin-1',
  username: 'admin',
  isActive: true,
  isRoot: false,
  roleIds: ['role-1'],
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01')
};
const role = {
  id: 'role-1',
  code: 'operator',
  name: '普通管理员',
  description: null,
  isActive: true,
  deletedAt: null,
  permissionIds: ['permission-1']
};
const permission = {
  id: 'permission-1',
  code: 'role.read',
  category: '角色',
  isAssignable: true,
  isProtected: false,
  name: '查询角色',
  description: null,
  isActive: true
};
/** 构造测试服务及其依赖 */
function createService(
  options: {
    /** 管理员服务。 */
    adminService?: Partial<AdminService>;
    /** 角色服务。 */
    roleService?: Partial<RoleService>;
    /** 权限服务。 */
    permissionService?: Partial<PermissionService>;
  } = {}
) {
  const adminService: Partial<AdminService> = {
    findById: vi.fn().mockResolvedValue(admin),
    listAdminRoleIds: vi.fn().mockResolvedValue(['role-1']),
    ...options.adminService
  };
  const roleService: Partial<RoleService> = {
    findByIds: vi.fn().mockResolvedValue([role]),
    ...options.roleService
  };
  const permissionService: Partial<PermissionService> = {
    findByIds: vi.fn().mockResolvedValue([permission]),
    ...options.permissionService
  };
  return {
    service: new AuthorizationService(
      adminService as AdminService,
      roleService as RoleService,
      permissionService as PermissionService
    ),
    adminService,
    roleService,
    permissionService
  };
}

describe('AuthorizationService', () => {
  it('应构建管理员授权上下文', async () => {
    const { service } = createService();

    await expect(service.getAuthorization('admin-1')).resolves.toMatchObject({
      admin,
      roles: [role],
      permissions: [permission]
    });
  });

  it('授权上下文不应包含停用权限', async () => {
    const { service } = createService({
      permissionService: {
        findByIds: vi
          .fn()
          .mockResolvedValue([permission, { ...permission, id: 'permission-2', code: 'role.write', isActive: false }])
      }
    });

    await expect(service.getAuthorization('admin-1')).resolves.toMatchObject({
      permissions: [permission]
    });
  });

  it('根管理员授权上下文不应包含停用权限', async () => {
    const { service } = createService({
      adminService: {
        findById: vi.fn().mockResolvedValue({ ...admin, isRoot: true })
      },
      permissionService: {
        findByIds: vi
          .fn()
          .mockResolvedValue([permission, { ...permission, id: 'permission-2', code: 'role.write', isActive: false }])
      }
    });

    await expect(service.getAuthorization('admin-1')).resolves.toMatchObject({
      permissions: [permission]
    });
  });

  it('管理员不存在时应抛出领域异常', async () => {
    const { service } = createService({
      adminService: { findById: vi.fn().mockResolvedValue(null) }
    });

    await expect(service.getAuthorization('missing')).rejects.toBeInstanceOf(DomainNotFoundError);
  });

  it('应处理无效、根管理员和普通权限判断', async () => {
    const invalid = createService({
      adminService: { findById: vi.fn().mockResolvedValue(null) }
    });
    await expect(invalid.service.hasPermission('missing', 'role.read')).resolves.toBe(false);

    const superAdmin = createService({
      adminService: {
        findById: vi.fn().mockResolvedValue({ ...admin, isRoot: true })
      }
    });
    await expect(superAdmin.service.hasPermission('admin-1', 'role.read')).resolves.toBe(true);

    const normal = createService();
    await expect(normal.service.hasPermission('admin-1', 'role.read')).resolves.toBe(true);
    await expect(normal.service.hasPermission('admin-1', 'admin.account.create')).resolves.toBe(false);
  });
});
