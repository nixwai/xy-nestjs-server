import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  ApiCommonResponses,
  ApiOkResponseData,
  ApiOkResponseEmpty,
  ApiVersionHeader,
} from '../../common/decorators/index.js';
import { CurrentAdmin } from '../auth/decorators/index.js';
import type { AdminJwtPayload } from '../auth/tokens/jwt-token.service.js';
import {
  RequirePermission,
  SuperAdminOnly,
} from '../authorization/decorators/index.js';
import { PermissionResource } from '../authorization/enums/index.js';
import {
  CreateRoleDto,
  RoleListResponseDto,
  RolePermissionBindingDto,
  RoleResponseDto,
  SoftDeleteRoleDto,
  UpdateRoleDto,
} from './dto/index.js';
import { RoleService } from './role.service.js';

/** 提供角色和角色权限关系管理接口。 */
@ApiTags('角色管理')
@ApiVersionHeader()
@ApiCommonResponses()
@Controller('role')
@SuperAdminOnly()
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  /** 查询未软删除的角色列表。 */
  @Get('list')
  @ApiOperation({
    summary: '查询角色列表',
    description: '返回系统中未软删除的角色及其权限 ID 列表。',
  })
  @ApiOkResponseData(RoleListResponseDto, { description: '角色列表和总数。' })
  @RequirePermission(PermissionResource.ROLE)
  async list() {
    const items = await this.roleService.listRoles();
    return { items, total: items.length };
  }

  /** 创建角色。 */
  @Post('create')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '创建角色',
    description: '创建一个新的角色编码、名称和描述。',
  })
  @ApiBody({ type: CreateRoleDto, description: '角色创建参数。' })
  @ApiOkResponseData(RoleResponseDto, { description: '创建成功后的角色信息。' })
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
  @ApiOperation({
    summary: '更新角色',
    description: '更新角色名称、描述或启用状态，必须提供角色 id。',
  })
  @ApiBody({ type: UpdateRoleDto, description: '角色更新参数。' })
  @ApiOkResponseData(RoleResponseDto, { description: '更新成功后的角色信息。' })
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
  @ApiOperation({
    summary: '软删除角色',
    description: '将角色标记为已删除，不执行物理删除。',
  })
  @ApiBody({ type: SoftDeleteRoleDto, description: '待删除角色 ID。' })
  @ApiOkResponseEmpty({ description: '删除成功，data 固定为 null。' })
  @RequirePermission(PermissionResource.ROLE)
  async softDelete(
    @CurrentAdmin() admin: AdminJwtPayload,
    @Body() body: SoftDeleteRoleDto,
  ) {
    await this.roleService.softDeleteRole(admin.sub, body.id);
    return null;
  }

  /** 为角色绑定权限。 */
  @Post('permission-bind')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '绑定角色权限',
    description: '为指定角色增加一项权限。角色和权限必须已存在。',
  })
  @ApiBody({ type: RolePermissionBindingDto, description: '角色和权限 ID。' })
  @ApiOkResponseEmpty({ description: '绑定成功，data 固定为 null。' })
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

  /** 解除角色权限绑定。 */
  @Post('permission-unbind')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '解绑角色权限',
    description: '解除指定角色和权限之间的绑定关系。',
  })
  @ApiBody({ type: RolePermissionBindingDto, description: '角色和权限 ID。' })
  @ApiOkResponseEmpty({ description: '解绑成功，data 固定为 null。' })
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
