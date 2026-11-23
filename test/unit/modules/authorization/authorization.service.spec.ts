import { describe, expect, it } from 'vitest';
import { AuthorizationService } from '#/modules/authorization/authorization.service.js';
import { DomainNotFoundError } from '#/common/errors/index.js';
import type { AdminService } from '#/modules/admin/admin.service.js';
import type { RoleService } from '#/modules/role/role.service.js';
import type { PermissionService } from '#/modules/permission/permission.service.js';

const admin = {
  id: 'admin-1',
  username: 'operator',
  isActive: true,
  isRoot: false,
  roleIds: ['role-1'],
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  passwordHash: 'hash',
  passwordSalt: 'salt',
  deletedAt: null
};
const role = {
  id: 'role-1',
  code: 'operator',
  name: '普通管理员',
  description: null,
  isActive: true,
  isSystem: false,
  isProtected: false,
  deletedAt: null,
  permissionIds: ['permission-1', 'permission-2']
};
const activePermission = {
  id: 'permission-1',
  code: 'asset.folder.read',
  category: 'asset',
  isAssignable: true,
  isProtected: false,
  name: '读取素材',
  description: null,
  isActive: true
};
const protectedPermission = {
  id: 'permission-2',
  code: 'system.protected',
  category: 'system',
  isAssignable: true,
  isProtected: true,
  name: '受保护权限',
  description: null,
  isActive: true
};

function createService(
  overrides: {
    adminService?: Partial<AdminService>;
    roleService?: Partial<RoleService>;
    permissionService?: Partial<PermissionService>;
  } = {}
) {
  const adminService = {
    findById: async () => admin,
    listAdminRoleIds: async () => ['role-1'],
    ...overrides.adminService
  } as AdminService;
  const roleService = {
    findByIds: async () => [role],
    ...overrides.roleService
  } as RoleService;
  const permissionService = {
    findByIds: async () => [activePermission, protectedPermission],
    ...overrides.permissionService
  } as PermissionService;

  return new AuthorizationService(adminService, roleService, permissionService);
}

describe('管理员授权服务', () => {
  it('构建授权上下文时去重角色权限并过滤停用或受保护权限', async () => {
    const service = createService({ roleService: { findByIds: async () => [role, role] } });

    await expect(service.getAuthorization('admin-1')).resolves.toMatchObject({
      admin: {
        id: admin.id,
        username: admin.username,
        isActive: admin.isActive,
        isRoot: admin.isRoot,
        roleIds: admin.roleIds,
        createdAt: admin.createdAt,
        updatedAt: admin.updatedAt
      },
      roles: [role, role],
      permissions: [activePermission]
    });
  });

  it('管理员不存在时返回领域资源缺失', async () => {
    const service = createService({ adminService: { findById: async () => null } });

    await expect(service.getAuthorization('missing')).rejects.toBeInstanceOf(DomainNotFoundError);
  });

  it('无效账号、停用账号和根管理员分别按无权限与全量权限判断', async () => {
    const invalid = createService({ adminService: { findById: async () => null } });
    await expect(invalid.hasPermission('missing', activePermission.code)).resolves.toBe(false);

    const inactive = createService({ adminService: { findById: async () => ({ ...admin, isActive: false }) } });
    await expect(inactive.hasPermission(admin.id, activePermission.code)).resolves.toBe(false);

    const root = createService({ adminService: { findById: async () => ({ ...admin, isRoot: true }) } });
    await expect(root.hasPermission(admin.id, 'unknown.permission')).resolves.toBe(true);
  });

  it('普通管理员只拥有授权上下文中的启用可分配权限', async () => {
    const service = createService();

    await expect(service.hasPermission(admin.id, activePermission.code)).resolves.toBe(true);
    await expect(service.hasPermission(admin.id, protectedPermission.code)).resolves.toBe(false);
  });
});
