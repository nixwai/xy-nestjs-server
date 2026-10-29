import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentAdmin } from '../auth/decorators/index.js';
import type { AdminJwtPayload } from '../auth/tokens/jwt-token.service.js';
import {
  RequirePermission,
  SuperAdminOnly,
} from '../authorization/decorators/index.js';
import { PermissionResource } from '../authorization/enums/index.js';
import {
  CreateRoleDto,
  SoftDeleteRoleDto,
  RolePermissionBindingDto,
  UpdateRoleDto,
} from './dto/index.js';
import { RoleService } from './role.service.js';

/** 提供角色和角色授权关系管理接口。 */
@ApiTags('角色管理')
@ApiBearerAuth()
@Controller('role')
@SuperAdminOnly()
export class RoleController {
  constructor(private readonly roleService: RoleService) {}
  /** 查询角色列表。 */
  @Get('list')
  @RequirePermission(PermissionResource.ROLE)
  async list() {
    const items = await this.roleService.listRoles();
    return { items, total: items.length };
  }
  /** 创建角色。 */
  @Post('create')
  @HttpCode(HttpStatus.OK)
  @RequirePermission(PermissionResource.ROLE)
  async create(
    @CurrentAdmin() admin: AdminJwtPayload,
    @Body() body: CreateRoleDto,
  ) {
    return this.roleService.createRole(admin.sub, body);
  }
  /** 更新角色。 */
  @Post('update')
  @HttpCode(HttpStatus.OK)
  @RequirePermission(PermissionResource.ROLE)
  async update(
    @CurrentAdmin() admin: AdminJwtPayload,
    @Body() body: UpdateRoleDto,
  ) {
    return this.roleService.updateRole(admin.sub, body.id, body);
  }
  /** 软删除角色。 */
  @Post('soft-delete')
  @HttpCode(HttpStatus.OK)
  @RequirePermission(PermissionResource.ROLE)
  async softDelete(
    @CurrentAdmin() admin: AdminJwtPayload,
    @Body() body: SoftDeleteRoleDto,
  ) {
    await this.roleService.softDeleteRole(admin.sub, body.id);
    return null;
  }
  /** 绑定角色权限。 */
  @Post('permission-bind')
  @HttpCode(HttpStatus.OK)
  @RequirePermission(PermissionResource.ROLE_PERMISSION)
  async bindPermission(
    @CurrentAdmin() admin: AdminJwtPayload,
    @Body() body: RolePermissionBindingDto,
  ) {
    await this.roleService.bindPermission(
      admin.sub,
      body.roleId,
      body.permissionId,
    );
    return null;
  }
  /** 解绑角色权限。 */
  @Post('permission-unbind')
  @HttpCode(HttpStatus.OK)
  @RequirePermission(PermissionResource.ROLE_PERMISSION)
  async unbindPermission(
    @CurrentAdmin() admin: AdminJwtPayload,
    @Body() body: RolePermissionBindingDto,
  ) {
    await this.roleService.unbindPermission(
      admin.sub,
      body.roleId,
      body.permissionId,
    );
    return null;
  }
}
