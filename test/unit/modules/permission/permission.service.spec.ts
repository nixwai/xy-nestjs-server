import { describe, expect, it, vi } from 'vitest';
import { PermissionService } from '../../../../src/modules/permission/permission.service.js';
import type { PermissionRepository } from '../../../../src/modules/permission/repositories/permission-repository.port.js';
import type { AuditService } from '../../../../src/modules/audit/audit.service.js';
import { REGISTERED_PERMISSIONS } from '../../../../src/modules/permission/constants/registered-permissions.constant.js';
import {
  PermissionResource,
  HttpMethod,
} from '../../../../src/modules/authorization/enums/index.js';

const permission = {
  id: 'permission-1',
  code: 'permission:get',
  resource: PermissionResource.PERMISSION,
  method: HttpMethod.GET,
  name: '查询权限',
  description: null,
  isActive: true,
};

function createService() {
  const repository: Partial<PermissionRepository> = {
    list: vi.fn().mockResolvedValue([permission]),
    findById: vi.fn().mockResolvedValue(permission),
    findByIds: vi.fn().mockResolvedValue([permission]),
    upsertRegistered: vi.fn().mockResolvedValue(permission),
    setActive: vi.fn().mockResolvedValue({ ...permission, isActive: false }),
  };
  const auditService: Partial<AuditService> = {
    record: vi.fn().mockResolvedValue(undefined),
  };
  return {
    service: new PermissionService(
      repository as PermissionRepository,
      auditService as AuditService,
    ),
    repository,
    auditService,
  };
}

describe('PermissionService', () => {
  it('应在模块初始化时同步注册权限', async () => {
    const { service, repository } = createService();

    await service.initializeDefaults();

    expect(repository.upsertRegistered).toHaveBeenCalledTimes(
      REGISTERED_PERMISSIONS.length,
    );
  });

  it('应透传权限查询和写入操作', async () => {
    const { service, repository } = createService();

    await expect(service.listPermissions()).resolves.toEqual([permission]);
    await expect(service.findById('permission-1')).resolves.toEqual(permission);
    await expect(service.findByIds(['permission-1'])).resolves.toEqual([
      permission,
    ]);
    await expect(service.upsertRegistered(permission)).resolves.toEqual(
      permission,
    );
    expect(repository.findById).toHaveBeenCalledWith('permission-1');
  });

  it('修改权限状态时应记录审计', async () => {
    const { service, auditService } = createService();

    await expect(
      service.setActive('admin-1', 'permission-1', false),
    ).resolves.toMatchObject({
      isActive: false,
    });
    expect(auditService.record).toHaveBeenCalledWith({
      actorAdminId: 'admin-1',
      action: 'permission.disable',
      resourceType: PermissionResource.PERMISSION,
      targetId: 'permission-1',
    });
  });
});
