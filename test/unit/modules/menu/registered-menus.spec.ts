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
    menuKey: 'resource',
    title: '资源',
    path: '/resource',
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
      ['resource', null]
    ]);
  });

  it('默认注册表应按深度优先展开系统管理菜单', () => {
    expect(flattenRegisteredMenus().map(entry => [entry.menuKey, entry.parentKey])).toEqual([
      ['home', null],
      ['system', null],
      ['system-admin', 'system'],
      ['system-role', 'system'],
      ['system-audit', 'system'],
      ['system-menu', 'system'],
      ['system-permission', 'system']
    ]);
  });
});
