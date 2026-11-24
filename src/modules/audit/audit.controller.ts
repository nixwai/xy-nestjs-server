import { Controller, Get, Inject, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ApiCommonResponses, ApiOkResponseData } from '#/common/decorators/index.js';
import { CurrentAdmin } from '../auth/admin/decorators/index.js';
import type { AdminJwtPayload } from '../auth/admin/types/admin-jwt.types.js';
import { RequirePermission } from '../authorization/decorators/index.js';
import { AuditLogListQueryDto, AuditLogListResponseDto, AuditOptionsResponseDto } from './dto/index.js';
import { PermissionCode } from '../authorization/constants/index.js';
import { AuditService } from './audit.service.js';
/** 提供管理员变更审计查询接口。 */
@ApiTags('审计')
@ApiCommonResponses()
@Controller('audit')
export class AuditController {
  /** 创建当前实例。 */
  constructor(@Inject(AuditService) private readonly auditService: AuditService) {}

  /** 查询审计筛选项。 */
  @Get('options')
  @ApiOperation({ summary: '查询审计筛选项' })
  @ApiOkResponseData(AuditOptionsResponseDto, { description: '审计动作、资源和结果筛选项。' })
  @RequirePermission(PermissionCode.AUDIT_READ)
  options(@CurrentAdmin() _admin: AdminJwtPayload) {
    return this.auditService.getOptions();
  }

  /** 查询管理员、角色和权限变更审计记录。 */
  @Get('list')
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    example: 20,
    description: '每页条数，范围 1-100。'
  })
  @ApiQuery({
    name: 'cursor',
    required: false,
    type: String,
    description: '上一页返回的不透明游标。'
  })
  @ApiQuery({
    name: 'actorAdminId',
    required: false,
    type: String,
    description: '按操作者管理员 ID 搜索。'
  })
  @ApiQuery({
    name: 'targetId',
    required: false,
    type: String,
    description: '按目标资源 ID 搜索。'
  })
  @ApiQuery({
    name: 'action',
    required: false,
    type: String,
    description: '按操作编码精确筛选。'
  })
  @ApiQuery({
    name: 'resourceType',
    required: false,
    type: String,
    description: '按资源类型精确筛选。'
  })
  @ApiQuery({
    name: 'succeeded',
    required: false,
    type: Boolean,
    description: '是否只返回成功或失败记录。'
  })
  @ApiQuery({
    name: 'createdFrom',
    required: false,
    type: String,
    format: 'date-time',
    description: '查询起始时间，包含该时刻。'
  })
  @ApiQuery({
    name: 'createdTo',
    required: false,
    type: String,
    format: 'date-time',
    description: '查询结束时间，包含该时刻。'
  })
  @ApiOperation({
    summary: '查询审计记录',
    description: '按创建时间和 ID 倒序返回审计记录，使用游标分页，不计算总数。'
  })
  @ApiOkResponseData(AuditLogListResponseDto, {
    description: '审计记录游标分页结果，不返回总数。'
  })
  @RequirePermission(PermissionCode.AUDIT_READ)
  async list(
    @CurrentAdmin() _admin: AdminJwtPayload,
    @Query() query: AuditLogListQueryDto = new AuditLogListQueryDto()
  ) {
    return this.auditService.list(query);
  }
}
