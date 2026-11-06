import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CursorPageResponseDto } from '#/common/dto/index.js';
import { AuditLogResponseDto } from './audit-log-response.dto.js';
/** 审计日志游标分页响应数据。 */
export class AuditLogListResponseDto extends CursorPageResponseDto<AuditLogResponseDto> {
  /** 列表数据。 */
  @ApiProperty({
    type: () => [AuditLogResponseDto],
    description: '当前页审计记录。'
  })
  declare items: AuditLogResponseDto[];
  /** 下一页定位游标。 */
  @ApiPropertyOptional({
    type: String,
    nullable: true,
    description: '下一页不透明游标。'
  })
  declare nextCursor: string | null;
}
