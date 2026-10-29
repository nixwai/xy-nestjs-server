import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
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
  AdminRoleBindingDto,
  CreateAdminDto,
  ListQueryDto,
  SoftDeleteAdminDto,
  UpdateAdminDto,
} from './dto/index.js';
import { AdminService } from './admin.service.js';

/** 提供管理员账户管理接口。 */
@ApiTags('管理员管理')
@ApiBearerAuth()
@Controller()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}
  /** 查询当前管理员。 */
  @Get('admin/me')
  @RequirePermission(PermissionResource.ADMIN_SELF)
  async me(@CurrentAdmin() admin: AdminJwtPayload) {
    return this.adminService.getMe(admin.sub);
  }
  /** 查询管理员列表。 */
  @Get('admin/list')
  @RequirePermission(PermissionResource.ADMIN)
  @SuperAdminOnly()
  async list(@Query() _query: ListQueryDto) {
    const items = await this.adminService.listAdmins();
    return { items, total: items.length };
  }
  /** 创建管理员。 */
  @Post('admin/create')
  @HttpCode(HttpStatus.OK)
  @RequirePermission(PermissionResource.ADMIN)
  @SuperAdminOnly()
  async create(
    @CurrentAdmin() admin: AdminJwtPayload,
    @Body() body: CreateAdminDto,
  ) {
    return this.adminService.createAdmin(admin.sub, body);
  }
  /** 更新管理员。 */
  @Post('admin/update')
  @HttpCode(HttpStatus.OK)
  @RequirePermission(PermissionResource.ADMIN)
  @SuperAdminOnly()
  async update(
    @CurrentAdmin() admin: AdminJwtPayload,
    @Body() body: UpdateAdminDto,
  ) {
    return this.adminService.updateAdmin(admin.sub, body);
  }
  /** 软删除管理员。 */
  @Post('admin/soft-delete')
  @HttpCode(HttpStatus.OK)
  @RequirePermission(PermissionResource.ADMIN)
  @SuperAdminOnly()
  async softDelete(
    @CurrentAdmin() admin: AdminJwtPayload,
    @Body() body: SoftDeleteAdminDto,
  ) {
    return this.adminService.softDeleteAdmin(
      admin.sub,
      body.id,
      body.currentPassword ?? '',
    );
  }
  /** 绑定管理员角色。 */
  @Post('admin/role-bind')
  @HttpCode(HttpStatus.OK)
  @RequirePermission(PermissionResource.ADMIN_ROLE)
  @SuperAdminOnly()
  async bindRole(
    @CurrentAdmin() admin: AdminJwtPayload,
    @Body() body: AdminRoleBindingDto,
  ) {
    return this.adminService.bindRole(admin.sub, body.adminId, body.roleId);
  }
  /** 解绑管理员角色。 */
  @Post('admin/role-unbind')
  @HttpCode(HttpStatus.OK)
  @RequirePermission(PermissionResource.ADMIN_ROLE)
  @SuperAdminOnly()
  async unbindRole(
    @CurrentAdmin() admin: AdminJwtPayload,
    @Body() body: AdminRoleBindingDto,
  ) {
    return this.adminService.unbindRole(admin.sub, body.adminId, body.roleId);
  }
}
