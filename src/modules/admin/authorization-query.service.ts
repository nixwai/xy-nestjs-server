import { Inject, Injectable } from '@nestjs/common';
import { PermissionService } from '../permission/permission.service.js';
import { RoleService } from '../role/role.service.js';
import { MenuService } from '../menu/menu.service.js';
import type { AdminPublicRecord } from './types/admin.types.js';
import type { AdminAuthorizationView } from './types/authorization.types.js';
import { buildMenuTree } from './utils/menu-tree.util.js';

/** 组装管理员当前授权信息和菜单树。 */
@Injectable()
export class AdminAuthorizationQueryService {
  constructor(
    @Inject(RoleService) private readonly roleService: RoleService,
    @Inject(PermissionService) private readonly permissionService: PermissionService,
    @Inject(MenuService) private readonly menuService: MenuService
  ) {}

  /** 查询管理员可用的权限编码和可见菜单树。 */
  async getAuthorization(admin: AdminPublicRecord): Promise<AdminAuthorizationView> {
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
