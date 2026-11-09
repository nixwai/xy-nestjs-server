import { BadRequestException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { MenuService } from '#/modules/menu/menu.service.js';
import { InMemoryMenuRepository } from '#/modules/menu/repositories/in-memory-menu.repository.js';
import { PermissionCode } from '#/modules/authorization/constants/index.js';
import type { PermissionRecord } from '#/modules/authorization/types/permission.types.js';
import { flattenRegisteredMenus } from '#/modules/menu/utils/registered-menu.util.js';
/** 菜单注册表绑定的权限记录，启动校验要求它在权限目录中真实存在。 */
const assetPermission: PermissionRecord = {
  id: 'permission-asset-folder-read',
  code: PermissionCode.ASSET_FOLDER_READ,
  name: '查看文件夹',
  description: '查看文件夹',
  category: 'asset',
  isAssignable: true,
  isProtected: false,
  isActive: true
};
const auditPermission: PermissionRecord = {
  id: 'permission-1',
  code: PermissionCode.AUDIT_READ,
  name: '查看审计',
  description: '查看管理员变更审计',
  category: 'system',
  isAssignable: true,
  isProtected: false,
  isActive: true
};
/** 构造测试服务及其依赖 */
function createService(permission: PermissionRecord | null = auditPermission) {
  const repository = new InMemoryMenuRepository();
  const audit = { record: vi.fn().mockResolvedValue(undefined) };
  const permissionService = {
    findByCode: vi.fn(async (code: string) => {
      if (!permission) return null;
      if (code === PermissionCode.ASSET_FOLDER_READ) return assetPermission;
      return code === permission.code ? permission : null;
    })
  };
  return { service: new MenuService(repository, audit as never, permissionService as never), repository, audit };
}

/** 按 menuKey 定位菜单，缺失时直接失败。 */
async function findMenu(service: MenuService, menuKey: string) {
  const item = (await service.list()).find(candidate => candidate.menuKey === menuKey);
  if (!item) throw new Error(`菜单 ${menuKey} 不存在`);
  return item;
}

describe('MenuService', () => {
  it('首次初始化应按注册表补齐缺失菜单', async () => {
    const { service } = createService();

    await service.onModuleInit();

    const items = await service.list();
    expect(items).toHaveLength(flattenRegisteredMenus().length);
    expect(items.find(item => item.menuKey === 'home')).toMatchObject({
      parentKey: null,
      path: '/home',
      title: '工作台',
      isActive: true
    });
  });

  it('注册表绑定的权限未入库时阻止启动', async () => {
    const { service } = createService(null);

    await expect(service.onModuleInit()).rejects.toBeInstanceOf(BadRequestException);
  });

  it('重复初始化不应覆盖管理员对菜单展示配置的修改', async () => {
    const { service } = createService();
    await service.onModuleInit();
    const seeded = await findMenu(service, 'home');

    await service.update('admin-1', seeded.id, { title: '首页', order: 9, isActive: false });
    await service.onModuleInit();

    await expect(findMenu(service, 'home')).resolves.toMatchObject({ title: '首页', order: 9, isActive: false });
  });

  it('拒绝空更新', async () => {
    const { service } = createService();
    await service.onModuleInit();
    const seeded = await findMenu(service, 'home');

    await expect(service.update('admin-1', seeded.id, {})).rejects.toBeInstanceOf(BadRequestException);
  });

  it('更新菜单时记录展示配置审计', async () => {
    const { service, audit } = createService();
    await service.onModuleInit();
    const seeded = await findMenu(service, 'home');

    await service.update('admin-1', seeded.id, { title: '首页' });

    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'menu.update', details: { menuKey: 'home', changes: { title: '首页' } } })
    );
  });
});
