import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  ApiCommonResponses,
  ApiOkResponseData,
} from '../../common/decorators/index.js';
import { CurrentAdmin } from '../auth/decorators/index.js';
import type { AdminJwtPayload } from '../auth/tokens/jwt-token.service.js';
import {
  RequirePermission,
  SuperAdminOnly,
} from '../authorization/decorators/index.js';
import { PermissionResource } from '../authorization/enums/index.js';
import { AuditLogListResponseDto } from './dto/index.js';
import { AuditService } from './audit.service.js';

/** 提供管理员变更审计查询接口。 */
@ApiTags('审计')
@ApiCommonResponses()
@Controller('audit')
@SuperAdminOnly()
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  /** 查询管理员、角色和权限变更审计记录。 */
  @Get('list')
  @ApiOperation({
    summary: '查询审计记录',
    description: '按创建时间倒序返回管理员、角色和权限相关的变更记录。',
  })
  @ApiOkResponseData(AuditLogListResponseDto, {
    description: '审计记录列表和总数。',
  })
  @RequirePermission(PermissionResource.AUDIT)
  async list(@CurrentAdmin() _admin: AdminJwtPayload) {
    const items = await this.auditService.list();
    return { items, total: items.length };
  }
}
