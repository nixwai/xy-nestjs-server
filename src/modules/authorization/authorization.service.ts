import { Inject, Injectable } from '@nestjs/common';
import { DomainNotFoundError } from '#/common/errors/index.js';
import { AdminService } from '../admin/admin.service.js';
import { RoleService } from '../role/role.service.js';
import { PermissionService } from '../permission/permission.service.js';
import type { AdminAuthorization } from '../admin/types/authorization.types.js';
/** 运行时授权判断服务。 */
@Injectable()
export class AuthorizationService {
  /** 创建当前实例。 */
  constructor(
    @Inject(AdminService) private readonly adminService: AdminService,
    @Inject(RoleService) private readonly roleService: RoleService,
    @Inject(PermissionService) private readonly permissionService: PermissionService
  ) {}

  /** 查询管理员授权上下文。 */
  async getAuthorization(adminId: string): Promise<AdminAuthorization> {
    const admin = await this.adminService.findById(adminId);
    if (!admin) {
      throw new DomainNotFoundError('管理员');
    }
    const roleIds = await this.adminService.listAdminRoleIds(adminId);
    const roles = await this.roleService.findByIds(roleIds);
    const permissionIds = [...new Set(roles.flatMap(role => role.permissionIds))];
    const permissions = (await this.permissionService.findByIds(permissionIds)).filter(
      permission => permission.isActive && (admin.isRoot || (permission.isAssignable && !permission.isProtected))
    );
    return {
      admin: {
        id: admin.id,
        username: admin.username,
        isActive: admin.isActive,
        isRoot: admin.isRoot,
        roleIds,
        createdAt: admin.createdAt,
        updatedAt: admin.updatedAt
      },
      roles,
      permissions
    };
  }

  /** 判断管理员是否拥有指定的动态权限。 */
  async hasPermission(adminId: string, permissionCode: string): Promise<boolean> {
    const admin = await this.adminService.findById(adminId);
    if (!admin || !admin.isActive) {
      return false;
    }
    if (admin.isRoot) {
      return true;
    }
    const authorization = await this.getAuthorization(adminId);
    return authorization.permissions.some(item => item.isActive && item.code === permissionCode);
  }
}
