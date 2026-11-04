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
  title: string;
  path: string;
  icon?: string;
  order: number;
  permissionCode: string | null;
  children?: MenuTreeItem[];
};

function buildMenuTree(items: MenuRecord[], isRoot: boolean, permissions: Set<string>) {
  const available = items.filter(
    item =>
      item.isActive &&
      (!item.isRootOnly || isRoot) &&
      (!item.permissionCode || isRoot || permissions.has(item.permissionCode))
  );
  const byParent = new Map<string | null, MenuRecord[]>();
  available.forEach(item => byParent.set(item.parentId, [...(byParent.get(item.parentId) ?? []), item]));
  const build = (parentId: string | null): MenuTreeItem[] =>
    (byParent.get(parentId) ?? [])
      .sort((a, b) => a.order - b.order || Number(a.id) - Number(b.id))
      .map(item => ({
        id: item.id,
        title: item.title,
        path: item.path,
        ...(item.icon ? { icon: item.icon } : {}),
        order: item.order,
        permissionCode: item.permissionCode,
        ...(byParent.has(item.id) ? { children: build(item.id) } : {})
      }));
  return build(null);
}
