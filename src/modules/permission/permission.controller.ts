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
  PermissionListResponseDto,
  PermissionResponseDto,
  PermissionStatusDto,
} from './dto/index.js';
import { PermissionService } from './permission.service.js';

/** 提供权限目录查询和启停管理接口。 */
@ApiTags('权限管理')
@ApiVersionHeader()
@ApiCommonResponses()
@Controller('permission')
@SuperAdminOnly()
export class PermissionController {
  constructor(private readonly permissionService: PermissionService) {}

  /** 查询代码注册的权限目录。 */
  @Get('list')
  @ApiOperation({
    summary: '查询权限目录',
    description: '返回代码注册的权限资源、HTTP 方法、名称和启用状态。',
  })
  @ApiOkResponseData(PermissionListResponseDto, {
    description: '权限列表和总数。',
  })
  @RequirePermission(PermissionResource.PERMISSION)
  async list() {
    const items = await this.permissionService.listPermissions();
    return { items, total: items.length };
  }

  /** 启用权限。 */
  @Post('enable')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '启用权限',
    description: '将指定权限设置为启用状态，变更会写入审计记录。',
  })
  @ApiBody({ type: PermissionStatusDto, description: '待启用权限 ID。' })
  @ApiOkResponseData(PermissionResponseDto, {
    description: '启用后的权限信息。',
  })
  @RequirePermission(PermissionResource.PERMISSION)
  async enable(
    @CurrentAdmin() admin: AdminJwtPayload,
    @Body() body: PermissionStatusDto,
  ) {
    return this.permissionService.setActive(admin.sub, body.id, true);
  }

  /** 停用权限。 */
  @Post('disable')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '停用权限',
    description: '将指定权限设置为停用状态，变更会写入审计记录。',
  })
  @ApiBody({ type: PermissionStatusDto, description: '待停用权限 ID。' })
  @ApiOkResponseData(PermissionResponseDto, {
    description: '停用后的权限信息。',
  })
  @RequirePermission(PermissionResource.PERMISSION)
  async disable(
    @CurrentAdmin() admin: AdminJwtPayload,
    @Body() body: PermissionStatusDto,
  ) {
    return this.permissionService.setActive(admin.sub, body.id, false);
  }
}
