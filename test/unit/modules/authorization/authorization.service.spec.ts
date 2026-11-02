import { describe, expect, it, vi } from 'vitest';
import { AuthorizationService } from '../../../../src/modules/authorization/authorization.service.js';
import type { AdminService } from '../../../../src/modules/admin/admin.service.js';
import type { RoleService } from '../../../../src/modules/role/role.service.js';
import type { PermissionService } from '../../../../src/modules/permission/permission.service.js';
import { HttpMethod, PermissionResource } from '../../../../src/modules/authorization/enums/index.js';
import { DomainNotFoundError } from '../../../../src/common/errors/index.js';

const admin = {
  id: 'admin-1',
  username: 'admin',
  isActive: true,
  isSuperAdmin: false,
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
  code: 'role:get',
  resource: PermissionResource.ROLE,
  method: HttpMethod.GET,
  name: '查询角色',
  description: null,
  isActive: true
};

function createService(
  options: {
    adminService?: Partial<AdminService>;
    roleService?: Partial<RoleService>;
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

  it('管理员不存在时应抛出领域异常', async () => {
    const { service } = createService({
      adminService: { findById: vi.fn().mockResolvedValue(null) }
    });

    await expect(service.getAuthorization('missing')).rejects.toBeInstanceOf(DomainNotFoundError);
  });

  it('应处理无效、超级管理员和普通权限判断', async () => {
    const invalid = createService({
      adminService: { findById: vi.fn().mockResolvedValue(null) }
    });
    await expect(invalid.service.hasPermission('missing', PermissionResource.ROLE, HttpMethod.GET)).resolves.toBe(
      false
    );

    const superAdmin = createService({
      adminService: {
        findById: vi.fn().mockResolvedValue({ ...admin, isSuperAdmin: true })
      }
    });
    await expect(superAdmin.service.hasPermission('admin-1', PermissionResource.ROLE, HttpMethod.GET)).resolves.toBe(
      true
    );

    const normal = createService();
    await expect(normal.service.hasPermission('admin-1', PermissionResource.ROLE, HttpMethod.GET)).resolves.toBe(true);
    await expect(normal.service.hasPermission('admin-1', PermissionResource.ADMIN, HttpMethod.POST)).resolves.toBe(
      false
    );
  });
});
