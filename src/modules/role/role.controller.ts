import { Body, Controller, Get, Inject, Post, Query } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiCommonResponses, ApiPageQuery, ApiOkResponseData, ApiOkResponseEmpty } from '#/common/decorators/index.js';
import { CurrentAdmin } from '../auth/decorators/index.js';
import type { AdminJwtPayload } from '../auth/types/jwt.types.js';
import { RootOnly } from '../authorization/decorators/index.js';
import {
  RoleCreateRequestDto,
  RoleListResponseDto,
  RolePermissionBindingRequestDto,
  RoleResponseDto,
  RoleSoftDeleteRequestDto,
  RoleUpdateRequestDto
} from './dto/index.js';
import { PageQueryDto } from '#/common/dto/index.js';
import { RoleService } from './role.service.js';

/** 提供角色和角色权限关系管理接口。 */
@ApiTags('角色管理')
@ApiCommonResponses()
@Controller('role')
@RootOnly()
export class RoleController {
  constructor(@Inject(RoleService) private readonly roleService: RoleService) {}

  /** 查询未软删除的角色列表。 */
  @Get('list')
  @ApiPageQuery()
  @ApiOperation({
    summary: '查询角色列表',
    description: '返回未软删除的角色分页列表及其权限 ID，按创建时间和 ID 倒序排列。'
  })
  @ApiOkResponseData(RoleListResponseDto, {
    description: '角色分页列表和分页元数据。'
  })
  async list(@Query() query: PageQueryDto = new PageQueryDto()) {
    return this.roleService.listRoles(query);
  }

  /** 创建角色。 */
  @Post('create')
  @ApiOperation({
    summary: '创建角色',
    description: '创建一个新的角色编码、名称和描述。'
  })
  @ApiBody({ type: RoleCreateRequestDto, description: '角色创建参数。' })
  @ApiOkResponseData(RoleResponseDto, { description: '创建成功后的角色信息。' })
  async create(@CurrentAdmin() admin: AdminJwtPayload, @Body() body: RoleCreateRequestDto) {
    return this.roleService.createRole(admin.sub, body);
  }

  /** 更新角色。 */
  @Post('update')
  @ApiOperation({
    summary: '更新角色',
    description: '更新角色名称、描述或启用状态，必须提供角色 id。'
  })
  @ApiBody({ type: RoleUpdateRequestDto, description: '角色更新参数。' })
  @ApiOkResponseData(RoleResponseDto, { description: '更新成功后的角色信息。' })
  async update(@CurrentAdmin() admin: AdminJwtPayload, @Body() body: RoleUpdateRequestDto) {
    return this.roleService.updateRole(admin.sub, body.id, body);
  }

  /** 软删除角色。 */
  @Post('soft-delete')
  @ApiOperation({
    summary: '软删除角色',
    description: '将角色标记为已删除，不执行物理删除。'
  })
  @ApiBody({ type: RoleSoftDeleteRequestDto, description: '待删除角色 ID。' })
  @ApiOkResponseEmpty({ description: '删除成功，data 固定为 null。' })
  async softDelete(@CurrentAdmin() admin: AdminJwtPayload, @Body() body: RoleSoftDeleteRequestDto) {
    await this.roleService.softDeleteRole(admin.sub, body.id);
    return null;
  }

  /** 为角色绑定权限。 */
  @Post('permission-bind')
  @ApiOperation({
    summary: '绑定角色权限',
    description: '为指定角色增加一项权限。角色和权限必须已存在。'
  })
  @ApiBody({
    type: RolePermissionBindingRequestDto,
    description: '角色和权限 ID。'
  })
  @ApiOkResponseEmpty({ description: '绑定成功，data 固定为 null。' })
  async bindPermission(@CurrentAdmin() admin: AdminJwtPayload, @Body() body: RolePermissionBindingRequestDto) {
    await this.roleService.bindPermission(admin.sub, body.roleId, body.permissionId);
    return null;
  }

  /** 解除角色权限绑定。 */
  @Post('permission-unbind')
  @ApiOperation({
    summary: '解绑角色权限',
    description: '解除指定角色和权限之间的绑定关系。'
  })
  @ApiBody({
    type: RolePermissionBindingRequestDto,
    description: '角色和权限 ID。'
  })
  @ApiOkResponseEmpty({ description: '解绑成功，data 固定为 null。' })
  async unbindPermission(@CurrentAdmin() admin: AdminJwtPayload, @Body() body: RolePermissionBindingRequestDto) {
    await this.roleService.unbindPermission(admin.sub, body.roleId, body.permissionId);
    return null;
  }
}
