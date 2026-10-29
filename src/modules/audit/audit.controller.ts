import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentAdmin } from '../auth/decorators/index.js';
import type { AdminJwtPayload } from '../auth/tokens/jwt-token.service.js';
import {
  RequirePermission,
  SuperAdminOnly,
} from '../authorization/decorators/index.js';
import { PermissionResource } from '../authorization/enums/index.js';
import { AuditService } from './audit.service.js';

/** 提供审计查询接口。 */
@ApiTags('审计')
@ApiBearerAuth()
@Controller('audit')
@SuperAdminOnly()
export class AuditController {
  constructor(private readonly auditService: AuditService) {}
  /** 查询管理员变更审计。 */
  @Get('list')
  @RequirePermission(PermissionResource.AUDIT)
  async list(@CurrentAdmin() _admin: AdminJwtPayload) {
    const items = await this.auditService.list();
    return { items, total: items.length };
  }
}
