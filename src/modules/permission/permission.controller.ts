import { Body, Controller, Get, Inject, Post } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiCommonResponses, ApiOkResponseData } from '#/common/decorators/index.js';
import { CurrentAdmin } from '../auth/decorators/index.js';
import type { AdminJwtPayload } from '../auth/types/jwt.types.js';
import { RootOnly } from '../authorization/decorators/index.js';
import { PermissionGroupListResponseDto, PermissionResponseDto, PermissionStatusRequestDto } from './dto/index.js';
import { countPermissions } from './utils/permission-group.util.js';
import { PermissionService } from './permission.service.js';

/** 提供权限目录查询和启停管理接口。 */
@ApiTags('权限管理')
@ApiCommonResponses()
@Controller('permission')
@RootOnly()
export class PermissionController {
  constructor(@Inject(PermissionService) private readonly permissionService: PermissionService) {}

  /** 查询完整权限目录。 */
  @Get('list')
  @ApiOperation({
    summary: '查询权限目录',
    description: '按分类分组返回完整动态权限目录，包含受保护权限和停用权限。'
  })
  @ApiOkResponseData(PermissionGroupListResponseDto, {
    description: '按分类分组的权限列表和权限总数。'
  })
  async list() {
    const groups = await this.permissionService.listPermissionGroups();
    return { groups, total: countPermissions(groups) };
  }

  /** 查询可绑定给普通角色的权限目录。 */
  @Get('assignable-list')
  @ApiOperation({
    summary: '查询可分配权限',
    description: '按分类分组返回启用且允许绑定给普通角色的权限，不包含 RootOnly 或受保护权限。'
  })
  @ApiOkResponseData(PermissionGroupListResponseDto, {
    description: '按分类分组的可分配权限列表和权限总数。'
  })
  async listAssignable() {
    const groups = await this.permissionService.listAssignablePermissionGroups();
    return { groups, total: countPermissions(groups) };
  }

  /** 启用权限。 */
  @Post('enable')
  @ApiOperation({
    summary: '启用权限',
    description: '将指定权限设置为启用状态，变更会写入审计记录。'
  })
  @ApiBody({ type: PermissionStatusRequestDto, description: '待启用权限 ID。' })
  @ApiOkResponseData(PermissionResponseDto, {
    description: '启用后的权限信息。'
  })
  async enable(@CurrentAdmin() admin: AdminJwtPayload, @Body() body: PermissionStatusRequestDto) {
    return this.permissionService.setActive(admin.sub, body.id, true);
  }

  /** 停用权限。 */
  @Post('disable')
  @ApiOperation({
    summary: '停用权限',
    description: '将指定权限设置为停用状态，变更会写入审计记录。'
  })
  @ApiBody({ type: PermissionStatusRequestDto, description: '待停用权限 ID。' })
  @ApiOkResponseData(PermissionResponseDto, {
    description: '停用后的权限信息。'
  })
  async disable(@CurrentAdmin() admin: AdminJwtPayload, @Body() body: PermissionStatusRequestDto) {
    return this.permissionService.setActive(admin.sub, body.id, false);
  }
}
