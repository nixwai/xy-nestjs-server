import { ApiProperty } from '@nestjs/swagger';
/** 管理员操作审计记录。 */
export class AuditLogResponseDto {
  /** 唯一标识。 */
  @ApiProperty({ type: String, description: '审计记录 ID。', example: '1' })
  id!: string;
  /** 执行操作的管理员标识。 */
  @ApiProperty({
    type: String,
    nullable: true,
    description: '操作者管理员 ID。系统操作可能为空。',
    example: '1'
  })
  actorAdminId!: string | null;
  /** 审计动作编码。 */
  @ApiProperty({
    type: String,
    description: '操作动作编码。',
    example: 'admin.create'
  })
  action!: string;
  /** 审计动作中文名称。 */
  @ApiProperty({ type: String, description: '操作动作中文名称。', example: '创建管理员' })
  actionLabel!: string;
  /** 被操作资源的类型。 */
  @ApiProperty({ type: String, description: '资源类型。', example: 'admin' })
  resourceType!: string;
  /** 资源类型中文名称。 */
  @ApiProperty({ type: String, description: '资源类型中文名称。', example: '管理员' })
  resourceTypeLabel!: string;
  /** 被操作资源的标识。 */
  @ApiProperty({
    type: String,
    nullable: true,
    description: '被操作资源 ID。',
    example: '2'
  })
  targetId!: string | null;
  /** 脱敏后的结构化变更详情。 */
  @ApiProperty({
    type: 'object',
    additionalProperties: true,
    nullable: true,
    description: '结构化变更摘要。没有摘要时为 null。',
    example: { isRoot: false }
  })
  details!: Record<string, unknown> | null;
  /** 操作是否成功。 */
  @ApiProperty({ type: Boolean, description: '操作是否成功。', example: true })
  succeeded!: boolean;
  /** 记录创建时间。 */
  @ApiProperty({ type: String, format: 'date-time', description: '创建时间。' })
  createdAt!: Date;
  /** 记录更新时间。 */
  @ApiProperty({
    type: String,
    format: 'date-time',
    description: '最后更新时间。'
  })
  updatedAt!: Date;
}
