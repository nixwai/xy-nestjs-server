import type { RegisteredMenu } from '../types/registered-menu.types.js';

/** 后端维护的嵌套菜单注册表，层级关系由 children 结构表达。 */
export const REGISTERED_MENUS: readonly RegisteredMenu[] = [
  {
    menuKey: 'home',
    title: '工作台',
    path: '/home',
    order: 1,
    permissionCode: null,
    isRootOnly: false
  }
];
