import { describe, expect, it, vi } from 'vitest';
import { TypeOrmMenuRepository } from '#/modules/menu/repositories/typeorm-menu.repository.js';

const menu = {
  id: '1',
  parentId: null,
  title: '工作台',
  path: '/home',
  icon: 'carbon:dashboard',
  order: 1,
  permissionCode: null,
  isRootOnly: false,
  isActive: false,
  deletedAt: null
};

describe('TypeOrmMenuRepository', () => {
  function createRepository() {
    const menus = {
      find: vi.fn().mockResolvedValue([menu]),
      findOne: vi.fn().mockResolvedValue(menu),
      create: vi.fn().mockImplementation(item => item),
      merge: vi.fn(),
      save: vi.fn().mockImplementation(async item => item),
      softRemove: vi.fn().mockResolvedValue(undefined)
    };
    return { repository: new TypeOrmMenuRepository(menus as never), menus };
  }

  it('种子菜单已存在时应原样返回且不写入数据库', async () => {
    const { repository, menus } = createRepository();

    await expect(repository.ensureSeed(menu)).resolves.toMatchObject({ id: '1', isActive: false });

    expect(menus.findOne).toHaveBeenCalledWith({ where: { path: '/home' }, withDeleted: true });
    expect(menus.merge).not.toHaveBeenCalled();
    expect(menus.save).not.toHaveBeenCalled();
  });

  it('种子菜单不存在时应创建', async () => {
    const { repository, menus } = createRepository();
    menus.findOne.mockResolvedValueOnce(null);

    await expect(repository.ensureSeed(menu)).resolves.toMatchObject({ path: '/home' });

    expect(menus.create).toHaveBeenCalled();
    expect(menus.save).toHaveBeenCalled();
  });
});
