import { BadRequestException, NotFoundException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { MenuService } from '#/modules/menu/menu.service.js';
import { InMemoryMenuRepository } from '#/modules/menu/repositories/in-memory-menu.repository.js';

function createService(permission = { code: 'booking.read', isActive: true, isProtected: false }) {
  const repository = new InMemoryMenuRepository();
  const audit = { record: vi.fn().mockResolvedValue(undefined) };
  const permissionService = { findByCode: vi.fn().mockResolvedValue(permission) };
  return {
    service: new MenuService(repository, audit as never, permissionService as never),
    repository,
    audit,
    permissionService
  };
}

describe('MenuService', () => {
  it('应创建、更新、启停和删除菜单并记录审计', async () => {
    const { service, audit } = createService();
    const created = await service.create('admin-1', {
      parentId: null,
      title: '预约',
      path: '/booking',
      icon: null,
      order: 1,
      permissionCode: 'booking.read',
      isRootOnly: false,
      isActive: true
    });
    await service.update('admin-1', created.id, { title: '预约管理' });
    await service.setActive('admin-1', created.id, false);
    await service.softDelete('admin-1', created.id);

    expect(audit.record).toHaveBeenCalledTimes(4);
    await expect(service.list()).resolves.toEqual([]);
  });

  it('首次初始化应创建缺失的种子菜单', async () => {
    const { service } = createService();

    await service.onModuleInit();

    await expect(service.list()).resolves.toEqual([
      expect.objectContaining({ path: '/home', title: '工作台', isActive: true })
    ]);
  });

  it('重复初始化不应覆盖管理员对种子菜单的修改', async () => {
    const { service } = createService();
    await service.onModuleInit();
    const [seeded] = await service.list();
    await service.update('admin-1', seeded.id, { title: '首页', order: 9 });
    await service.setActive('admin-1', seeded.id, false);

    await service.onModuleInit();

    const [current] = await service.list();
    expect(current).toMatchObject({ id: seeded.id, title: '首页', order: 9, isActive: false });
  });

  it('种子菜单被删除后重复初始化不应重新创建', async () => {
    const { service } = createService();
    await service.onModuleInit();
    const [seeded] = await service.list();
    await service.softDelete('admin-1', seeded.id);

    await service.onModuleInit();

    await expect(service.list()).resolves.toEqual([]);
  });

  it('拒绝未知、停用或不适配根菜单的权限', async () => {
    const missing = createService(null as never);
    await expect(
      missing.service.create('admin-1', {
        parentId: null,
        title: '未知',
        path: '/missing',
        icon: null,
        order: 1,
        permissionCode: 'missing.read',
        isRootOnly: false,
        isActive: true
      })
    ).rejects.toBeInstanceOf(NotFoundException);

    const inactive = createService({ code: 'booking.read', isActive: false, isProtected: false });
    await expect(
      inactive.service.create('admin-1', {
        parentId: null,
        title: '停用',
        path: '/inactive',
        icon: null,
        order: 1,
        permissionCode: 'booking.read',
        isRootOnly: false,
        isActive: true
      })
    ).rejects.toBeInstanceOf(BadRequestException);

    const protectedPermission = createService({ code: 'admin.account.read', isActive: true, isProtected: true });
    await expect(
      protectedPermission.service.create('admin-1', {
        parentId: null,
        title: '受保护',
        path: '/protected',
        icon: null,
        order: 1,
        permissionCode: 'admin.account.read',
        isRootOnly: false,
        isActive: true
      })
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
