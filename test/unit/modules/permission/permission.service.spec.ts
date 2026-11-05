import { Logger } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { PermissionService } from '#/modules/permission/permission.service.js';
import type { PermissionRepository } from '#/modules/permission/repositories/permission-repository.port.js';
import { InMemoryPermissionRepository } from '#/modules/permission/repositories/in-memory-permission.repository.js';
import type { AuditService } from '#/modules/audit/audit.service.js';
import type { PermissionRecord } from '#/modules/authorization/types/permission.types.js';
import { REGISTERED_PERMISSIONS } from '#/modules/permission/constants/registered-permissions.constant.js';

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

/** 使用内存仓储验证启动同步的真实读写行为。 */
function createSynchronizingService() {
  const repository = new InMemoryPermissionRepository();
  const auditService: Partial<AuditService> = { record: vi.fn().mockResolvedValue(undefined) };
  return {
    service: new PermissionService(repository, auditService as AuditService),
    repository
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

describe('PermissionService 启动同步', () => {
  it('首次初始化应创建注册表中缺失的权限', async () => {
    const { service } = createSynchronizingService();

    await service.onModuleInit();

    const items = await service.listPermissions();

    expect(items).toHaveLength(REGISTERED_PERMISSIONS.length);
    for (const definition of REGISTERED_PERMISSIONS) {
      expect(items).toContainEqual(expect.objectContaining({ ...definition, isActive: true }));
    }
  });

  it('重复初始化不应覆盖数据库保存的启用状态', async () => {
    const { service } = createSynchronizingService();
    await service.onModuleInit();
    const [seeded] = await service.listPermissions();

    await service.setActive('admin-1', seeded.id, false);
    await service.onModuleInit();

    await expect(service.findByCode(seeded.code)).resolves.toMatchObject({ isActive: false });
  });

  it('重复初始化应把漂移的代码维护字段对齐到注册表', async () => {
    const { service, repository } = createSynchronizingService();
    await service.onModuleInit();
    const [seeded] = await service.listPermissions();
    await repository.updateDefinition(seeded.id, { name: '旧名称', isProtected: true, isAssignable: false });
    await repository.setActive(seeded.id, false);

    await service.onModuleInit();

    await expect(service.findByCode(seeded.code)).resolves.toMatchObject({
      ...REGISTERED_PERMISSIONS[0],
      isActive: false
    });
  });

  it('初始化不应删除注册表之外的历史权限', async () => {
    const { service, repository } = createSynchronizingService();
    await repository.create({
      code: 'legacy.report.read',
      name: '历史权限',
      description: null,
      category: 'legacy',
      isAssignable: true,
      isProtected: false,
      isActive: false
    });

    await service.onModuleInit();

    await expect(service.findByCode('legacy.report.read')).resolves.toMatchObject({ isActive: false });
  });

  it('注册表之外的历史权限只告警不阻止启动', async () => {
    const { service, repository } = createSynchronizingService();
    await repository.create({
      code: 'legacy.report.read',
      name: '历史权限',
      description: null,
      category: 'legacy',
      isAssignable: true,
      isProtected: false,
      isActive: false
    });
    const warn = vi.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);

    await expect(service.onModuleInit()).resolves.toBeUndefined();

    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('legacy.report.read'));
    await expect(service.findByCode('legacy.report.read')).resolves.toMatchObject({ isActive: false });
    warn.mockRestore();
  });

  it('注册表覆盖全部数据库权限时不告警', async () => {
    const { service } = createSynchronizingService();
    const warn = vi.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);

    await service.onModuleInit();

    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  it('定义一致时重复初始化不应写入数据库', async () => {
    const { service, repository } = createSynchronizingService();
    await service.onModuleInit();
    const create = vi.spyOn(repository, 'create');
    const updateDefinition = vi.spyOn(repository, 'updateDefinition');

    await service.onModuleInit();

    expect(create).not.toHaveBeenCalled();
    expect(updateDefinition).not.toHaveBeenCalled();
  });
});
