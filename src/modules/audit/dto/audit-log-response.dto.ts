import { ApiProperty } from '@nestjs/swagger';

/** 管理员操作审计记录。 */
export class AuditLogResponseDto {
  @ApiProperty({ type: String, description: '审计记录 ID。', example: '1' })
  id!: string;

  @ApiProperty({
    type: String,
    nullable: true,
    description: '操作者管理员 ID。系统操作可能为空。',
    example: '1'
  })
  actorAdminId!: string | null;

  @ApiProperty({
    type: String,
    description: '操作动作编码。',
    example: 'admin.create'
  })
  action!: string;

  @ApiProperty({ type: String, description: '资源类型。', example: 'admin' })
  resourceType!: string;

  @ApiProperty({
    type: String,
    nullable: true,
    description: '被操作资源 ID。',
    example: '2'
  })
  targetId!: string | null;

  @ApiProperty({
    type: 'object',
    additionalProperties: true,
    nullable: true,
    description: '结构化变更摘要。没有摘要时为 null。',
    example: { isSuperAdmin: false }
  })
  details!: Record<string, unknown> | null;

  @ApiProperty({ type: Boolean, description: '操作是否成功。', example: true })
  succeeded!: boolean;

  @ApiProperty({ type: String, format: 'date-time', description: '创建时间。' })
  createdAt!: Date;

  @ApiProperty({
    type: String,
    format: 'date-time',
    description: '最后更新时间。'
  })
  updatedAt!: Date;
}
