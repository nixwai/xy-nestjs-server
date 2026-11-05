import { describe, expect, it, vi } from 'vitest';
import { PermissionService } from '#/modules/permission/permission.service.js';
import type { PermissionRepository } from '#/modules/permission/repositories/permission-repository.port.js';
import type { AuditService } from '#/modules/audit/audit.service.js';
import type { PermissionRecord } from '#/modules/authorization/types/permission.types.js';

const permission: PermissionRecord = {
  id: 'permission-1',
  code: 'system.audit.read',
  name: '查看审计',
  description: null,
  category: 'system',
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
  it('应透传动态权限查询操作', async () => {
    const { service } = createService();

    await expect(service.listPermissions()).resolves.toEqual([permission]);
    await expect(service.findById('permission-1')).resolves.toEqual(permission);
    await expect(service.findByCode('system.audit.read')).resolves.toEqual(permission);
    await expect(service.findByIds(['permission-1'])).resolves.toEqual([permission]);
  });

  it('应按分类声明顺序分组返回权限目录', async () => {
    const { service, repository } = createService();
    repository.list = vi
      .fn()
      .mockResolvedValue([{ ...permission, id: 'permission-9', code: 'legacy.read', category: 'legacy' }, permission]);

    const groups = await service.listPermissionGroups();

    expect(groups.map(group => group.category)).toEqual(['system', 'legacy']);
    expect(groups[0]).toMatchObject({ categoryName: '系统管理', permissions: [permission] });
    expect(groups[1]).toMatchObject({ categoryName: 'legacy' });
  });

  it('分组返回可分配权限时应排除停用和受保护权限', async () => {
    const { service, repository } = createService();
    repository.list = vi
      .fn()
      .mockResolvedValue([
        permission,
        { ...permission, id: 'permission-2', code: 'system.audit.export', isActive: false },
        { ...permission, id: 'permission-3', code: 'system.audit.manage', isAssignable: false, isProtected: true }
      ]);

    await expect(service.listAssignablePermissionGroups()).resolves.toEqual([
      { category: 'system', categoryName: '系统管理', permissions: [permission] }
    ]);
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
