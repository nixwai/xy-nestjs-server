import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import type { PermissionService } from '#/modules/permission/permission.service.js';
import { RoleService } from '#/modules/role/role.service.js';
import type { PermissionRecord } from '#/modules/authorization/types/permission.types.js';
import type { RoleRecord } from '#/modules/role/types/role.types.js';
import type { RoleRepository } from '#/modules/role/repositories/role-repository.port.js';
import type { AuditService } from '#/modules/audit/audit.service.js';

const role: RoleRecord = {
  id: 'role-1',
  code: 'operator',
  name: '普通管理员',
  description: null,
  isActive: true,
  isSystem: false,
  isProtected: false,
  deletedAt: null,
  permissionIds: []
};
const permission: PermissionRecord = {
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
    /** 数据仓储。 */
    repository?: Partial<RoleRepository>;
    /** 权限服务。 */
    permissionService?: Partial<PermissionService>;
    /** 审计服务。 */
    auditService?: Partial<AuditService>;
  } = {}
): {
  /** 业务服务。 */
  service: RoleService;
  /** 数据仓储。 */
  repository: Partial<RoleRepository>;
  /** 权限服务。 */
  permissionService: Partial<PermissionService>;
  /** 审计服务。 */
  auditService: Partial<AuditService>;
} {
  const repository: Partial<RoleRepository> = {
    list: vi.fn().mockResolvedValue({
      items: [role],
      total: 1,
      page: 1,
      pageSize: 20,
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: false
    }),
    findById: vi.fn().mockResolvedValue(role),
    findByIds: vi.fn().mockResolvedValue([role]),
    findByCode: vi.fn().mockResolvedValue(role),
    create: vi.fn().mockResolvedValue(role),
    update: vi.fn().mockResolvedValue(role),
    softDelete: vi.fn().mockResolvedValue(undefined),
    bindPermission: vi.fn().mockResolvedValue(undefined),
    unbindPermission: vi.fn().mockResolvedValue(undefined),
    ...options.repository
  };
  const permissionService: Partial<PermissionService> = {
    findById: vi.fn().mockResolvedValue(permission),
    ...options.permissionService
  };
  const auditService: Partial<AuditService> = {
    record: vi.fn().mockResolvedValue(undefined),
    ...options.auditService
  };

  return {
    service: new RoleService(
      repository as RoleRepository,
      permissionService as PermissionService,
      auditService as AuditService
    ),
    repository,
    permissionService,
    auditService
  };
}

describe('RoleService', () => {
  it('应创建、更新和删除角色并记录审计', async () => {
    const { service, repository, auditService } = createService();

    await service.createRole('admin-1', {
      code: 'operator',
      name: '普通管理员'
    });
    await service.updateRole('admin-1', 'role-1', { isActive: false });
    await service.softDeleteRole('admin-1', 'role-1');

    expect(repository.create).toHaveBeenCalled();
    expect(repository.update).toHaveBeenCalledWith('role-1', {
      isActive: false
    });
    expect(repository.softDelete).toHaveBeenCalledWith('role-1');
    expect(auditService.record).toHaveBeenCalledTimes(3);
  });

  it('绑定权限前应校验角色和权限', async () => {
    const { service } = createService({
      repository: { findById: vi.fn().mockResolvedValue(null) }
    });
    await expect(service.bindPermission('admin-1', 'missing', 'permission-1')).rejects.toBeInstanceOf(
      NotFoundException
    );

    const { service: missingPermissionService } = createService({
      permissionService: { findById: vi.fn().mockResolvedValue(null) }
    });
    await expect(missingPermissionService.bindPermission('admin-1', 'role-1', 'missing')).rejects.toBeInstanceOf(
      NotFoundException
    );
  });

  it('拒绝将受保护权限绑定给普通角色', async () => {
    const { service } = createService({
      permissionService: {
        findById: vi.fn().mockResolvedValue({ ...permission, isAssignable: false, isProtected: true })
      }
    });

    await expect(service.bindPermission('admin-1', 'role-1', 'permission-1')).rejects.toBeInstanceOf(
      ForbiddenException
    );
  });

  it('应绑定和解绑权限并记录审计', async () => {
    const { service, repository, auditService } = createService();

    await service.bindPermission('admin-1', 'role-1', 'permission-1');
    await service.unbindPermission('admin-1', 'role-1', 'permission-1');

    expect(repository.bindPermission).toHaveBeenCalledWith('role-1', 'permission-1');
    expect(repository.unbindPermission).toHaveBeenCalledWith('role-1', 'permission-1');
    expect(auditService.record).toHaveBeenCalledTimes(2);
  });

  it('应透传角色查询结果', async () => {
    const { service } = createService();

    await expect(service.listRoles()).resolves.toMatchObject({
      items: [role],
      total: 1
    });
    await expect(service.findById('role-1')).resolves.toEqual(role);
    await expect(service.findByIds(['role-1'])).resolves.toEqual([role]);
    await expect(service.findByCode('operator')).resolves.toEqual(role);
  });
});
