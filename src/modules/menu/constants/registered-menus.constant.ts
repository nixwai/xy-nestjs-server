import { PermissionCode } from '../../authorization/constants/permission-code.constant.js';
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
  },
  {
    menuKey: 'system',
    title: '系统管理',
    path: '/system-management',
    order: 2,
    permissionCode: null,
    isRootOnly: false,
    children: [
      {
        menuKey: 'system-admin',
        title: '系统管理员',
        path: '/system-management/admin',
        order: 1,
        permissionCode: null,
        isRootOnly: true
      },
      {
        menuKey: 'system-role',
        title: '角色管理',
        path: '/system-management/role',
        order: 1,
        permissionCode: null,
        isRootOnly: true
      },
      {
        menuKey: 'system-audit',
        title: '审计日志',
        path: '/system-management/audit',
        order: 1,
        permissionCode: PermissionCode.AUDIT_READ,
        isRootOnly: false
      },
      {
        menuKey: 'system-menu',
        title: '菜单管理',
        path: '/system-management/menu',
        order: 1,
        permissionCode: null,
        isRootOnly: true
      },
      {
        menuKey: 'system-permission',
        title: '权限管理',
        path: '/system-management/permission',
        order: 1,
        permissionCode: null,
        isRootOnly: true
      }
    ]
  }
];
