import { Body, Controller, Get, Inject, Post, Query } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiCommonResponses, ApiOkResponseData, ApiPageQuery } from '#/common/decorators/index.js';
import { CurrentAdmin } from '../auth/admin/decorators/index.js';
import { CurrentUser } from '../auth/user/decorators/index.js';
import type { AdminJwtPayload } from '../auth/admin/types/admin-jwt.types.js';
import type { UserJwtPayload } from '../auth/user/types/user-jwt.types.js';
import { AdminOnly, UserOnly } from '../authorization/decorators/index.js';
import { Authenticated, RequirePermission } from '../authorization/decorators/index.js';
import { PermissionCode } from '../authorization/constants/index.js';
import {
  UserListResponseDto,
  UserListQueryDto,
  UserProfileResponseDto,
  UserResponseDto,
  UserUpdateRequestDto
} from './dto/index.js';
import { UserService } from './user.service.js';

/** 提供小程序当前用户资料接口。 */
@ApiTags('用户')
@ApiCommonResponses()
@Controller('user')
@UserOnly()
export class UserController {
  /** 创建当前实例。 */
  constructor(@Inject(UserService) private readonly userService: UserService) {}

  /** 查询当前登录用户的公开资料。 */
  @Get('me')
  @ApiOperation({ summary: '查询当前用户', description: '返回当前微信用户的公开资料。' })
  @ApiOkResponseData(UserProfileResponseDto, { description: '当前用户资料。' })
  @Authenticated()
  async me(@CurrentUser() user: UserJwtPayload) {
    return this.userService.getProfile(user.sub);
  }
}

/** 提供后台用户管理接口。 */
@ApiTags('用户管理')
@ApiCommonResponses()
@Controller('user')
@AdminOnly()
export class UserManagementController {
  /** 创建当前实例。 */
  constructor(@Inject(UserService) private readonly userService: UserService) {}

  /** 查询用户列表。 */
  @Get('list')
  @ApiPageQuery()
  @ApiOperation({ summary: '查询用户列表', description: '按关键词和状态分页查询微信用户。' })
  @ApiOkResponseData(UserListResponseDto, { description: '用户分页列表。' })
  @RequirePermission(PermissionCode.USER_READ)
  async list(@Query() query: UserListQueryDto = new UserListQueryDto()) {
    return this.userService.listUsers(query);
  }

  /** 更新用户资料或状态。 */
  @Post('update')
  @ApiOperation({ summary: '更新用户', description: '更新用户展示资料或启用状态。' })
  @ApiBody({ type: UserUpdateRequestDto, description: '用户更新参数。' })
  @ApiOkResponseData(UserResponseDto, { description: '更新后的用户信息。' })
  @RequirePermission(PermissionCode.USER_UPDATE)
  async update(@CurrentAdmin() admin: AdminJwtPayload, @Body() body: UserUpdateRequestDto) {
    return this.userService.updateUser(admin.sub, body);
  }
}
