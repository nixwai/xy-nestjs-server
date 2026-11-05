import { Body, Controller, Get, Inject, Post, Query } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiCommonResponses, ApiPageQuery, ApiOkResponseData, ApiOkResponseEmpty } from '#/common/decorators/index.js';
import { CurrentAdmin } from '../auth/decorators/index.js';
import type { AdminJwtPayload } from '../auth/types/jwt.types.js';
import { Authenticated, RootOnly } from '../authorization/decorators/index.js';
import {
  AdminListResponseDto,
  AdminResponseDto,
  AdminMeResponseDto,
  AdminResetPasswordRequestDto,
  AdminRoleBindingRequestDto,
  AdminCreateRequestDto,
  AdminListQueryDto,
  AdminSoftDeleteRequestDto,
  AdminUpdateRequestDto
} from './dto/index.js';
import { AdminService } from './admin.service.js';
import { AdminAuthorizationQueryService } from './authorization-query.service.js';
import { PasswordTransportService } from '#/common/security/index.js';

/** 提供管理员账户、状态和角色绑定管理接口。 */
@ApiTags('管理员管理')
@ApiCommonResponses()
@Controller()
export class AdminController {
  constructor(
    @Inject(AdminService) private readonly adminService: AdminService,
    @Inject(AdminAuthorizationQueryService) private readonly authorizationQueryService: AdminAuthorizationQueryService,
    @Inject(PasswordTransportService) private readonly passwordTransportService: PasswordTransportService
  ) {}

  /** 查询当前登录管理员的公开信息。 */
  @Get('admin/me')
  @ApiOperation({
    summary: '查询当前管理员',
    description: '返回当前 accessToken 对应管理员的公开信息和角色 ID。'
  })
  @ApiOkResponseData(AdminMeResponseDto, {
    description: '当前管理员信息和授权信息。'
  })
  @Authenticated()
  async me(@CurrentAdmin() admin: AdminJwtPayload) {
    const profile = await this.adminService.getMe(admin.sub);
    const authorization = await this.authorizationQueryService.getAuthorization(profile);
    return { ...profile, ...authorization };
  }

  /** 查询管理员列表。 */
  @Get('admin/list')
  @ApiPageQuery()
  @ApiOperation({
    summary: '查询管理员列表',
    description: '返回未软删除的管理员分页列表，按创建时间和 ID 倒序排列。'
  })
  @ApiOkResponseData(AdminListResponseDto, {
    description: '管理员分页列表和分页元数据。'
  })
  @RootOnly()
  async list(@Query() query: AdminListQueryDto = new AdminListQueryDto()) {
    return this.adminService.listAdmins(query);
  }

  /** 创建管理员账户。 */
  @Post('admin/create')
  @ApiOperation({
    summary: '创建管理员',
    description: '创建管理员账户。创建根管理员时必须提供当前登录管理员密码。'
  })
  @ApiBody({ type: AdminCreateRequestDto, description: '管理员创建参数。' })
  @ApiOkResponseData(AdminResponseDto, {
    description: '创建成功后的管理员信息。'
  })
  @RootOnly()
  async create(@CurrentAdmin() admin: AdminJwtPayload, @Body() body: AdminCreateRequestDto) {
    return this.adminService.createAdmin(admin.sub, {
      username: body.username,
      password: this.passwordTransportService.decryptPassword(body.password),
      isRoot: body.isRoot,
      currentPassword: this.passwordTransportService.decryptOptionalPassword(body.currentPassword, '当前密码')
    });
  }

  /** 更新管理员账户。 */
  @Post('admin/update')
  @ApiOperation({
    summary: '更新管理员',
    description: '更新管理员用户名、密码、启用状态或根管理员状态。敏感变更需要当前密码。'
  })
  @ApiBody({
    type: AdminUpdateRequestDto,
    description: '管理员更新参数，必须包含 id。'
  })
  @ApiOkResponseData(AdminResponseDto, {
    description: '更新成功后的管理员信息。'
  })
  @RootOnly()
  async update(@CurrentAdmin() admin: AdminJwtPayload, @Body() body: AdminUpdateRequestDto) {
    return this.adminService.updateAdmin(admin.sub, {
      id: body.id,
      username: body.username,
      password: this.passwordTransportService.decryptOptionalPassword(body.password),
      isActive: body.isActive,
      isRoot: body.isRoot,
      currentPassword: this.passwordTransportService.decryptOptionalPassword(body.currentPassword, '当前密码')
    });
  }

  /** 重置管理员密码。 */
  @Post('admin/reset-password')
  @ApiOperation({
    summary: '重置管理员密码',
    description: '重置指定管理员密码，需要当前登录管理员密码。'
  })
  @ApiBody({
    type: AdminResetPasswordRequestDto,
    description: '管理员密码重置参数。'
  })
  @ApiOkResponseData(AdminResponseDto, {
    description: '密码重置后的管理员信息。'
  })
  @RootOnly()
  async resetPassword(@CurrentAdmin() admin: AdminJwtPayload, @Body() body: AdminResetPasswordRequestDto) {
    return this.adminService.resetAdminPassword(
      admin.sub,
      body.id,
      this.passwordTransportService.decryptPassword(body.password),
      this.passwordTransportService.decryptPassword(body.currentPassword, '当前密码')
    );
  }

  /** 软删除管理员账户。 */
  @Post('admin/soft-delete')
  @ApiOperation({
    summary: '软删除管理员',
    description: '将管理员标记为已删除，不执行物理删除。操作需要当前登录管理员密码。'
  })
  @ApiBody({ type: AdminSoftDeleteRequestDto, description: '管理员删除参数。' })
  @ApiOkResponseEmpty({ description: '删除成功，data 固定为 null。' })
  @RootOnly()
  async softDelete(@CurrentAdmin() admin: AdminJwtPayload, @Body() body: AdminSoftDeleteRequestDto) {
    return this.adminService.softDeleteAdmin(
      admin.sub,
      body.id,
      this.passwordTransportService.decryptOptionalPassword(body.currentPassword, '当前密码') ?? ''
    );
  }

  /** 为管理员绑定角色。 */
  @Post('admin/role-bind')
  @ApiOperation({
    summary: '绑定管理员角色',
    description: '为指定管理员增加一个角色绑定。重复绑定会返回业务冲突错误。'
  })
  @ApiBody({
    type: AdminRoleBindingRequestDto,
    description: '管理员和角色 ID。'
  })
  @ApiOkResponseEmpty({ description: '绑定成功，data 固定为 null。' })
  @RootOnly()
  async bindRole(@CurrentAdmin() admin: AdminJwtPayload, @Body() body: AdminRoleBindingRequestDto) {
    return this.adminService.bindRole(admin.sub, body.adminId, body.roleId);
  }

  /** 解除管理员角色绑定。 */
  @Post('admin/role-unbind')
  @ApiOperation({
    summary: '解绑管理员角色',
    description: '解除指定管理员和角色之间的绑定关系。'
  })
  @ApiBody({
    type: AdminRoleBindingRequestDto,
    description: '管理员和角色 ID。'
  })
  @ApiOkResponseEmpty({ description: '解绑成功，data 固定为 null。' })
  @RootOnly()
  async unbindRole(@CurrentAdmin() admin: AdminJwtPayload, @Body() body: AdminRoleBindingRequestDto) {
    return this.adminService.unbindRole(admin.sub, body.adminId, body.roleId);
  }
}
