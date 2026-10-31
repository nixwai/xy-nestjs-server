import { ApiProperty } from '@nestjs/swagger';
import { AuditLogResponseDto } from './audit-log-response.dto.js';

/** 审计记录列表响应数据。 */
export class AuditLogListResponseDto {
  @ApiProperty({
    type: () => [AuditLogResponseDto],
    description: '审计记录列表。',
  })
  items!: AuditLogResponseDto[];

  @ApiProperty({ type: Number, description: '审计记录总数。', example: 1 })
  total!: number;
}
