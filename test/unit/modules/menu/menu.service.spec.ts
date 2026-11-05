import { BadRequestException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { MenuService } from '#/modules/menu/menu.service.js';
import { InMemoryMenuRepository } from '#/modules/menu/repositories/in-memory-menu.repository.js';

function createService(permission: { code: string; isActive: boolean } | null = null) {
  const repository = new InMemoryMenuRepository();
  const audit = { record: vi.fn().mockResolvedValue(undefined) };
  const permissionService = { findByCode: vi.fn().mockResolvedValue(permission) };
  return { service: new MenuService(repository, audit as never, permissionService as never), repository, audit };
}

describe('MenuService', () => {
  it('首次初始化应创建缺失的工作台菜单', async () => {
    const { service } = createService();
    await service.onModuleInit();
    await expect(service.list()).resolves.toEqual([
      expect.objectContaining({ menuKey: 'home', path: '/home', title: '工作台', isActive: true })
    ]);
  });

  it('重复初始化不应覆盖管理员对菜单展示配置的修改', async () => {
    const { service } = createService();
    await service.onModuleInit();
    const [seeded] = await service.list();
    await service.update('admin-1', seeded.id, { title: '首页', order: 9, isActive: false });
    await service.onModuleInit();
    await expect(service.list()).resolves.toEqual([
      expect.objectContaining({ menuKey: 'home', title: '首页', order: 9, isActive: false })
    ]);
  });

  it('拒绝空更新', async () => {
    const { service } = createService();
    await service.onModuleInit();
    const [seeded] = await service.list();
    await expect(service.update('admin-1', seeded.id, {})).rejects.toBeInstanceOf(BadRequestException);
  });

  it('更新菜单时记录展示配置审计', async () => {
    const { service, audit } = createService();
    await service.onModuleInit();
    const [seeded] = await service.list();
    await service.update('admin-1', seeded.id, { title: '首页' });
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'menu.update', details: { menuKey: 'home', changes: { title: '首页' } } })
    );
  });
});
