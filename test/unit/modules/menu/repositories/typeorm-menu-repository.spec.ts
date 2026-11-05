import { describe, expect, it, vi } from 'vitest';
import { TypeOrmMenuRepository } from '#/modules/menu/repositories/typeorm-menu.repository.js';

const menu = {
  id: '1',
  menuKey: 'home',
  parentKey: null,
  title: '工作台',
  path: '/home',
  order: 1,
  permissionCode: null,
  isRootOnly: false,
  isActive: false
};

describe('TypeOrmMenuRepository', () => {
  function createRepository() {
    const menus = {
      find: vi.fn().mockResolvedValue([menu]),
      findOne: vi.fn().mockResolvedValue(menu),
      create: vi.fn().mockImplementation(item => item),
      merge: vi.fn((item, input) => Object.assign(item, input)),
      save: vi.fn().mockImplementation(async item => ({ ...menu, ...item }))
    };
    return { repository: new TypeOrmMenuRepository(menus as never), menus };
  }

  it('应按 menuKey 查询菜单并映射公开字段', async () => {
    const { repository, menus } = createRepository();
    await expect(repository.findByMenuKey('home')).resolves.toEqual(menu);
    expect(menus.findOne).toHaveBeenCalledWith({ where: { menuKey: 'home' } });
  });

  it('应只更新标题、排序和启用状态', async () => {
    const { repository, menus } = createRepository();
    await expect(repository.update('1', { title: '首页', order: 2, isActive: true })).resolves.toMatchObject({
      title: '首页'
    });
    expect(menus.merge).toHaveBeenCalledWith(menu, { title: '首页', order: 2, isActive: true });
    expect(menus.save).toHaveBeenCalled();
  });
});
