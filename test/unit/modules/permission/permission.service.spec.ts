import { describe, expect, it, vi } from 'vitest';
import { PermissionService } from '#/modules/permission/permission.service.js';
import type { PermissionRepository } from '#/modules/permission/repositories/permission-repository.port.js';
import type { AuditService } from '#/modules/audit/audit.service.js';
import { REGISTERED_PERMISSIONS } from '#/modules/permission/constants/registered-permissions.constant.js';
import type { PermissionRecord } from '#/modules/authorization/types/permission.types.js';

const permission: PermissionRecord = {
  id: 'permission-1',
  code: 'booking.read',
  name: '查看预约',
  description: null,
  category: '预约',
  isAssignable: true,
  isProtected: false,
  isActive: true
};

function createService() {
  const repository: Partial<PermissionRepository> = {
    list: vi.fn().mockResolvedValue([permission]),
    findById: vi.fn().mockResolvedValue(permission),
    findByCode: vi.fn().mockResolvedValue(permission),
    findByIds: vi.fn().mockResolvedValue([permission]),
    ensureRegistered: vi.fn().mockResolvedValue(permission),
    setActive: vi.fn().mockResolvedValue({ ...permission, isActive: false })
  };
  const auditService: Partial<AuditService> = { record: vi.fn().mockResolvedValue(undefined) };
  return {
    service: new PermissionService(repository as PermissionRepository, auditService as AuditService),
    repository,
    auditService
  };
}

describe('PermissionService', () => {
  it('应在模块初始化时同步注册权限', async () => {
    const { service, repository } = createService();
    await service.initializeDefaults();
    expect(repository.ensureRegistered).toHaveBeenCalledTimes(REGISTERED_PERMISSIONS.length);
  });

  it('应透传动态权限查询和注册操作', async () => {
    const { service } = createService();
    await expect(service.listPermissions()).resolves.toEqual([permission]);
    await expect(service.findById('permission-1')).resolves.toEqual(permission);
    await expect(service.findByCode('booking.read')).resolves.toEqual(permission);
    await expect(service.findByIds(['permission-1'])).resolves.toEqual([permission]);
    await expect(service.ensureRegistered(permission)).resolves.toEqual(permission);
  });

  it('修改权限状态时应记录审计', async () => {
    const { service, auditService } = createService();
    await expect(service.setActive('admin-1', 'permission-1', false)).resolves.toMatchObject({ isActive: false });
    expect(auditService.record).toHaveBeenCalledWith({
      actorAdminId: 'admin-1',
      action: 'permission.disable',
      resourceType: 'permission',
      targetId: 'permission-1'
    });
  });
});
