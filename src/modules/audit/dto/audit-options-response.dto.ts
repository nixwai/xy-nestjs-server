import { ApiProperty } from '@nestjs/swagger';

/** 审计筛选项。 */
export class AuditOptionDto {
  /** 选项展示名称。 */
  @ApiProperty({ type: String, example: '创建管理员' })
  label!: string;

  /** 选项编码。 */
  @ApiProperty({ type: String, example: 'admin.create' })
  value!: string;
}

/** 审计筛选项响应。 */
export class AuditOptionsResponseDto {
  /** 审计动作选项。 */
  @ApiProperty({ type: () => [AuditOptionDto] })
  actions!: AuditOptionDto[];

  /** 审计资源选项。 */
  @ApiProperty({ type: () => [AuditOptionDto] })
  resources!: AuditOptionDto[];

  /** 审计结果选项。 */
  @ApiProperty({ type: () => [AuditOptionDto] })
  results!: AuditOptionDto[];
}
