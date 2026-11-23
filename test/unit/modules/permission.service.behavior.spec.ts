import { describe, expect, it, vi } from 'vitest';
import { Logger } from '@nestjs/common';
import { PermissionService } from '#/modules/permission/permission.service.js';
import type { PermissionRepository } from '#/modules/permission/repositories/permission-repository.port.js';
import type { AuditService } from '#/modules/audit/audit.service.js';
import { REGISTERED_PERMISSIONS } from '#/modules/permission/constants/registered-permissions.constant.js';
import { PermissionCode } from '#/modules/authorization/constants/index.js';

function createService(items: any[] = []) {
  const createPermission = vi.fn(async (input: any) => ({ id: String(items.length + 1), ...input }));
  const setActivePermission = vi.fn(async (id: string, isActive: boolean) => ({
    ...(items.find(item => item.id === id) ?? items[0]),
    isActive
  }));
  const repository: PermissionRepository = {
    list: vi.fn().mockResolvedValue(items),
    findById: vi.fn(async id => items.find(item => item.id === id) ?? null),
    findByIds: vi.fn(async ids => items.filter(item => ids.includes(item.id))),
    findByCode: vi.fn(async code => items.find(item => item.code === code) ?? null),
    create: createPermission,
    updateDefinition: vi.fn(async (id, patch) => ({ ...(items.find(item => item.id === id) ?? items[0]), ...patch })),
    setActive: setActivePermission
  };
  const auditRecord = vi.fn().mockResolvedValue(undefined);
  const auditService = { record: auditRecord } as unknown as AuditService;
  return {
    service: new PermissionService(repository, auditService),
    repository,
    auditService,
    auditRecord,
    createPermission,
    setActivePermission
  };
}

describe('权限目录功能', () => {
  it('过滤停用权限、不可分配权限和受保护权限', async () => {
    const items = [
      { ...REGISTERED_PERMISSIONS[0], id: '1', isActive: true },
      { ...REGISTERED_PERMISSIONS[1], id: '2', isActive: false },
      { ...REGISTERED_PERMISSIONS[2], id: '3', isActive: true, isAssignable: false, isProtected: true }
    ];
    const { service } = createService(items);

    await expect(service.listAssignablePermissions()).resolves.toEqual([items[0]]);
  });

  it('切换权限状态时验证存在并记录审计', async () => {
    const item = { ...REGISTERED_PERMISSIONS[0], id: '1', isActive: true };
    const { service, auditRecord } = createService([item]);

    await expect(service.setActive('admin-1', '1', false)).resolves.toMatchObject({ id: '1', isActive: false });
    expect(auditRecord).toHaveBeenCalledWith({
      actorAdminId: 'admin-1',
      action: 'permission.disable',
      resourceType: 'permission',
      targetId: '1'
    });
    await expect(service.setActive('admin-1', 'missing', true)).rejects.toThrow('权限不存在');
  });

  it('初始化补齐注册表，保留数据库启用状态并告警历史权限', async () => {
    const { service, createPermission, setActivePermission } = createService([
      { ...REGISTERED_PERMISSIONS[0], id: '1', isActive: false },
      {
        id: 'legacy',
        code: 'legacy.read',
        name: '历史权限',
        description: null,
        category: 'legacy',
        isAssignable: true,
        isProtected: false,
        isActive: false
      }
    ]);
    const warn = vi.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);

    await service.onModuleInit();

    expect(createPermission).toHaveBeenCalled();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('legacy.read'));
    expect(setActivePermission).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  it('按编码查询注册权限', async () => {
    const item = {
      ...REGISTERED_PERMISSIONS.find(item => item.code === PermissionCode.AUDIT_READ)!,
      id: '1',
      isActive: true
    };
    const { service } = createService([item]);
    await expect(service.findByCode(PermissionCode.AUDIT_READ)).resolves.toMatchObject({
      code: PermissionCode.AUDIT_READ
    });
  });
});
