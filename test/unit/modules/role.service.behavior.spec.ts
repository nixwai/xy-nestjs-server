import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { RoleService } from '#/modules/role/role.service.js';
import type { RoleRepository } from '#/modules/role/repositories/role-repository.port.js';
import type { PermissionService } from '#/modules/permission/permission.service.js';
import type { AuditService } from '#/modules/audit/audit.service.js';

const role = {
  id: 'role-1',
  code: 'operator',
  name: '操作员',
  description: null,
  isActive: true,
  isSystem: false,
  isProtected: false,
  deletedAt: null,
  permissionIds: []
};
const permission = {
  id: 'permission-1',
  code: 'asset.folder.read',
  name: '读取素材',
  description: null,
  category: 'asset',
  isAssignable: true,
  isProtected: false,
  isActive: true
};

function createService(
  options: {
    repository?: Partial<RoleRepository>;
    permissionService?: Partial<PermissionService>;
  } = {}
) {
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
    bindPermissions: vi.fn().mockResolvedValue(undefined),
    unbindPermissions: vi.fn().mockResolvedValue(undefined),
    ...options.repository
  };
  const permissionService: Partial<PermissionService> = {
    findByIds: vi.fn().mockResolvedValue([permission]),
    ...options.permissionService
  };
  const auditService: Partial<AuditService> = { record: vi.fn().mockResolvedValue(undefined) };
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

describe('角色及权限绑定业务', () => {
  it('创建、更新和软删除角色都记录审计', async () => {
    const { service, auditService } = createService();

    await expect(service.createRole('admin-1', { code: 'operator', name: '操作员' })).resolves.toEqual(role);
    await expect(service.updateRole('admin-1', 'role-1', { name: '新名称' })).resolves.toEqual(role);
    await expect(service.softDeleteRole('admin-1', 'role-1')).resolves.toBeUndefined();
    expect(auditService.record).toHaveBeenCalledTimes(3);
  });

  it('绑定权限去重并拒绝不存在、停用、不可分配和受保护权限', async () => {
    const { service, repository } = createService();

    await expect(
      service.bindPermissions('admin-1', 'role-1', ['permission-1', 'permission-1'])
    ).resolves.toBeUndefined();
    expect(repository.bindPermissions).toHaveBeenCalledWith('role-1', ['permission-1']);

    const cases = [
      { permission: null, error: NotFoundException },
      { permission: { ...permission, isActive: false }, error: ForbiddenException },
      { permission: { ...permission, isAssignable: false }, error: ForbiddenException },
      { permission: { ...permission, isProtected: true }, error: ForbiddenException }
    ];
    for (const item of cases) {
      const next = createService({
        permissionService: { findByIds: vi.fn().mockResolvedValue(item.permission ? [item.permission] : []) }
      });
      await expect(next.service.bindPermissions('admin-1', 'role-1', ['permission-1'])).rejects.toBeInstanceOf(
        item.error
      );
    }
  });

  it('不存在角色时不能绑定或解绑，空权限列表不产生关系变更', async () => {
    const missing = createService({ repository: { findById: vi.fn().mockResolvedValue(null) } });
    await expect(missing.service.bindPermissions('admin-1', 'missing', ['permission-1'])).rejects.toBeInstanceOf(
      NotFoundException
    );

    const empty = createService();
    await expect(empty.service.bindPermissions('admin-1', 'role-1', [])).resolves.toBeUndefined();
    await expect(empty.service.unbindPermissions('admin-1', 'role-1', [])).resolves.toBeUndefined();
    expect(empty.repository.bindPermissions).not.toHaveBeenCalled();
    expect(empty.repository.unbindPermissions).not.toHaveBeenCalled();
  });

  it('解绑不要求权限仍存在，允许清理历史关系', async () => {
    const { service, repository } = createService();

    await expect(
      service.unbindPermissions('admin-1', 'role-1', ['legacy-permission', 'legacy-permission'])
    ).resolves.toBeUndefined();
    expect(repository.unbindPermissions).toHaveBeenCalledWith('role-1', ['legacy-permission']);
  });
});
