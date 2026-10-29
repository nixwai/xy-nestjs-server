import { NotFoundException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { PermissionService } from '../../../../src/modules/permission/permission.service.js';
import { RoleService } from '../../../../src/modules/role/role.service.js';
import type { PermissionRecord } from '../../../../src/common/types/permission.types.js';
import type { RoleRecord } from '../../../../src/modules/role/types/role.types.js';
import type { RoleRepository } from '../../../../src/modules/role/repositories/role-repository.port.js';
import type { AuditService } from '../../../../src/modules/audit/audit.service.js';
import {
  HttpMethod,
  PermissionResource,
} from '../../../../src/common/enums/index.js';

const role: RoleRecord = {
  id: 'role-1',
  code: 'operator',
  name: '普通管理员',
  description: null,
  isActive: true,
  deletedAt: null,
  permissionIds: [],
};
const permission: PermissionRecord = {
  id: 'permission-1',
  code: 'role:get',
  resource: PermissionResource.ROLE,
  method: HttpMethod.GET,
  name: '查询角色',
  description: null,
  isActive: true,
};

function createService(
  options: {
    repository?: Partial<RoleRepository>;
    permissionService?: Partial<PermissionService>;
    auditService?: Partial<AuditService>;
  } = {},
): {
  service: RoleService;
  repository: Partial<RoleRepository>;
  permissionService: Partial<PermissionService>;
  auditService: Partial<AuditService>;
} {
  const repository: Partial<RoleRepository> = {
    list: vi.fn().mockResolvedValue([role]),
    findById: vi.fn().mockResolvedValue(role),
    findByIds: vi.fn().mockResolvedValue([role]),
    findByCode: vi.fn().mockResolvedValue(role),
    create: vi.fn().mockResolvedValue(role),
    update: vi.fn().mockResolvedValue(role),
    remove: vi.fn().mockResolvedValue(undefined),
    bindPermission: vi.fn().mockResolvedValue(undefined),
    unbindPermission: vi.fn().mockResolvedValue(undefined),
    ...options.repository,
  };
  const permissionService: Partial<PermissionService> = {
    findById: vi.fn().mockResolvedValue(permission),
    ...options.permissionService,
  };
  const auditService: Partial<AuditService> = {
    record: vi.fn().mockResolvedValue(undefined),
    ...options.auditService,
  };

  return {
    service: new RoleService(
      repository as RoleRepository,
      permissionService as PermissionService,
      auditService as AuditService,
    ),
    repository,
    permissionService,
    auditService,
  };
}

describe('RoleService', () => {
  it('应创建、更新和删除角色并记录审计', async () => {
    const { service, repository, auditService } = createService();

    await service.createRole('admin-1', {
      code: 'operator',
      name: '普通管理员',
    });
    await service.updateRole('admin-1', 'role-1', { isActive: false });
    await service.removeRole('admin-1', 'role-1');

    expect(repository.create).toHaveBeenCalled();
    expect(repository.update).toHaveBeenCalledWith('role-1', {
      isActive: false,
    });
    expect(repository.remove).toHaveBeenCalledWith('role-1');
    expect(auditService.record).toHaveBeenCalledTimes(3);
  });

  it('绑定权限前应校验角色和权限', async () => {
    const { service } = createService({
      repository: { findById: vi.fn().mockResolvedValue(null) },
    });
    await expect(
      service.bindPermission('admin-1', 'missing', 'permission-1'),
    ).rejects.toBeInstanceOf(NotFoundException);

    const { service: missingPermissionService } = createService({
      permissionService: { findById: vi.fn().mockResolvedValue(null) },
    });
    await expect(
      missingPermissionService.bindPermission('admin-1', 'role-1', 'missing'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('应绑定和解绑权限并记录审计', async () => {
    const { service, repository, auditService } = createService();

    await service.bindPermission('admin-1', 'role-1', 'permission-1');
    await service.unbindPermission('admin-1', 'role-1', 'permission-1');

    expect(repository.bindPermission).toHaveBeenCalledWith(
      'role-1',
      'permission-1',
    );
    expect(repository.unbindPermission).toHaveBeenCalledWith(
      'role-1',
      'permission-1',
    );
    expect(auditService.record).toHaveBeenCalledTimes(2);
  });

  it('应透传角色查询结果', async () => {
    const { service } = createService();

    await expect(service.listRoles()).resolves.toEqual([role]);
    await expect(service.findById('role-1')).resolves.toEqual(role);
    await expect(service.findByIds(['role-1'])).resolves.toEqual([role]);
    await expect(service.findByCode('operator')).resolves.toEqual(role);
  });
});
