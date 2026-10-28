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
} from '../../common/decorators/index.js';
import { PermissionResource } from '../../common/enums/index.js';
import { PermissionStatusDto } from './dto/permission.dto.js';
import { PermissionService } from './permission.service.js';

/** 提供权限目录管理接口。 */
@ApiTags('权限管理')
@ApiBearerAuth()
@Controller('permission')
@SuperAdminOnly()
export class PermissionController {
  constructor(private readonly permissionService: PermissionService) {}
  /** 查询权限目录。 */
  @Get('list')
  @RequirePermission(PermissionResource.PERMISSION)
  async list() {
    const items = await this.permissionService.listPermissions();
    return { items, total: items.length };
  }
  /** 启用权限。 */
  @Post('enable')
  @HttpCode(HttpStatus.OK)
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
  @RequirePermission(PermissionResource.PERMISSION)
  async disable(
    @CurrentAdmin() admin: AdminJwtPayload,
    @Body() body: PermissionStatusDto,
  ) {
    return this.permissionService.setActive(admin.sub, body.id, false);
  }
}
