import { Inject, Injectable } from '@nestjs/common';
import { PermissionService } from '../permission/permission.service.js';
import { RoleService } from '../role/role.service.js';
import { MenuService } from '../menu/menu.service.js';
import type { AdminPublicRecord } from './types/admin.types.js';
import type { MenuRecord } from '../menu/types/menu.types.js';

/** 组装管理员当前授权信息和菜单树。 */
@Injectable()
export class AdminAuthorizationQueryService {
  constructor(
    @Inject(RoleService) private readonly roleService: RoleService,
    @Inject(PermissionService) private readonly permissionService: PermissionService,
    @Inject(MenuService) private readonly menuService: MenuService
  ) {}

  async getAuthorization(admin: AdminPublicRecord) {
    const roles = await this.roleService.findByIds(admin.roleIds);
    const permissionIds = [...new Set(roles.filter(role => role.isActive).flatMap(role => role.permissionIds))];
    const permissions = admin.isRoot
      ? await this.permissionService.listPermissions()
      : await this.permissionService.findByIds(permissionIds);
    const permissionCodes = permissions
      .filter(item => item.isActive && (admin.isRoot || (item.isAssignable && !item.isProtected)))
      .map(item => item.code);
    const menus = await this.menuService.list();
    return { permissions: permissionCodes, menus: buildMenuTree(menus, admin.isRoot, new Set(permissionCodes)) };
  }
}

export type MenuTreeItem = {
  id: string;
  menuKey: string;
  title: string;
  path: string;
  order: number;
  permissionCode: string | null;
  children?: MenuTreeItem[];
};

type MenuListItem = MenuRecord & { permissionAvailable: boolean };

function buildMenuTree(items: MenuListItem[], isRoot: boolean, permissions: Set<string>): MenuTreeItem[] {
  const byParent = new Map<string | null, MenuListItem[]>();
  items.forEach(item => byParent.set(item.parentKey, [...(byParent.get(item.parentKey) ?? []), item]));

  const build = (parentKey: string | null): MenuTreeItem[] => {
    return (byParent.get(parentKey) ?? [])
      .filter(item => item.isActive && (!item.isRootOnly || isRoot) && isPermissionAvailable(item, permissions))
      .sort((left, right) => left.order - right.order || Number(left.id) - Number(right.id))
      .flatMap(item => {
        const children = build(item.menuKey);
        const isDirectory = item.permissionCode === null && item.menuKey !== 'home';
        if (isDirectory && children.length === 0) return [];
        return [
          {
            id: item.id,
            menuKey: item.menuKey,
            title: item.title,
            path: item.path,
            order: item.order,
            permissionCode: item.permissionCode,
            ...(children.length > 0 ? { children } : {})
          }
        ];
      });
  };

  return build(null);
}

function isPermissionAvailable(item: MenuListItem, permissions: Set<string>): boolean {
  if (!item.permissionCode) return true;
  return item.permissionAvailable && permissions.has(item.permissionCode);
}
