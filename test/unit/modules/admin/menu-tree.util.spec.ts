import { describe, expect, it } from 'vitest';
import { buildMenuTree } from '#/modules/admin/utils/menu-tree.util.js';
import type { MenuListItem } from '#/modules/menu/types/menu.types.js';
/** 构造菜单列表项，默认字段覆盖注册表中的常见形态。 */
function menuItem(overrides: Partial<MenuListItem> & Pick<MenuListItem, 'id' | 'menuKey' | 'path'>): MenuListItem {
  return {
    parentKey: null,
    title: overrides.menuKey,
    order: 1,
    permissionCode: null,
    isRootOnly: false,
    isActive: true,
    permissionAvailable: true,
    ...overrides
  };
}

describe('buildMenuTree', () => {
  it('无权限编码的叶子菜单对根管理员可见', () => {
    const items = [
      menuItem({ id: '1', menuKey: 'home', path: '/home' }),
      menuItem({ id: '2', menuKey: 'system', path: '/system', order: 2 }),
      menuItem({ id: '3', menuKey: 'system-admin', parentKey: 'system', path: '/system/admin', isRootOnly: true })
    ];

    const tree = buildMenuTree(items, true, new Set());

    expect(tree.map(item => item.path)).toEqual(['/home', '/system']);
    expect(tree[1].children?.map(item => item.path)).toEqual(['/system/admin']);
  });

  it('非根管理员看不到仅限根管理员的菜单', () => {
    const items = [
      menuItem({ id: '1', menuKey: 'home', path: '/home' }),
      menuItem({ id: '2', menuKey: 'system', path: '/system', order: 2 }),
      menuItem({ id: '3', menuKey: 'system-admin', parentKey: 'system', path: '/system/admin', isRootOnly: true })
    ];

    expect(buildMenuTree(items, false, new Set()).map(item => item.path)).toEqual(['/home']);
  });

  it('剔除无可见子菜单的目录节点并保留权限可用的叶子菜单', () => {
    const items = [
      menuItem({ id: '1', menuKey: 'home', path: '/home' }),
      menuItem({ id: '2', menuKey: 'report', path: '/report', order: 2 }),
      menuItem({
        id: '3',
        menuKey: 'report-daily',
        parentKey: 'report',
        path: '/report/daily',
        permissionCode: 'report.read',
        permissionAvailable: false
      }),
      menuItem({ id: '4', menuKey: 'audit', path: '/audit', order: 3, permissionCode: 'system.audit.read' })
    ];

    const tree = buildMenuTree(items, true, new Set(['system.audit.read']));

    expect(tree.map(item => item.path)).toEqual(['/home', '/audit']);
  });

  it('过滤停用菜单并按排序值和 ID 排序', () => {
    const items = [
      menuItem({ id: '1', menuKey: 'home', path: '/home', order: 2 }),
      menuItem({ id: '2', menuKey: 'disabled', path: '/disabled', order: 1, isActive: false }),
      menuItem({ id: '4', menuKey: 'b', path: '/b', order: 1 }),
      menuItem({ id: '3', menuKey: 'a', path: '/a', order: 1 })
    ];

    expect(buildMenuTree(items, true, new Set()).map(item => item.path)).toEqual(['/a', '/b', '/home']);
  });
});
