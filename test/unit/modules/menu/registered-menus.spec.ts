import { describe, expect, it } from 'vitest';
import type { RegisteredMenu } from '#/modules/menu/types/registered-menu.types.js';
import { flattenRegisteredMenus } from '#/modules/menu/utils/registered-menu.util.js';

const nested: readonly RegisteredMenu[] = [
  {
    menuKey: 'system',
    title: '系统',
    path: '/system',
    order: 1,
    permissionCode: null,
    isRootOnly: true,
    children: [
      {
        menuKey: 'system.audit',
        title: '审计',
        path: '/system/audit',
        order: 1,
        permissionCode: null,
        isRootOnly: true,
        children: [
          {
            menuKey: 'system.audit.detail',
            title: '审计详情',
            path: '/system/audit/detail',
            order: 1,
            permissionCode: null,
            isRootOnly: true
          }
        ]
      }
    ]
  },
  {
    menuKey: 'booking',
    title: '预约',
    path: '/booking',
    order: 2,
    permissionCode: null,
    isRootOnly: false
  }
];

describe('flattenRegisteredMenus', () => {
  it('应按深度优先展开嵌套结构并回填 parentKey', () => {
    expect(flattenRegisteredMenus(nested).map(entry => [entry.menuKey, entry.parentKey])).toEqual([
      ['system', null],
      ['system.audit', 'system'],
      ['system.audit.detail', 'system.audit'],
      ['booking', null]
    ]);
  });

  it('默认注册表展开后应只包含工作台根菜单', () => {
    expect(flattenRegisteredMenus()).toEqual([expect.objectContaining({ menuKey: 'home', parentKey: null })]);
  });
});
