import { ApiProperty } from '@nestjs/swagger';
/** 应用存活检查响应数据。 */
export class HealthResponseDto {
  /** 当前状态。 */
  @ApiProperty({
    type: String,
    enum: ['ok'],
    description: '服务状态。',
    example: 'ok'
  })
  status!: 'ok';
  /** 当前运行环境名称。 */
  @ApiProperty({
    type: String,
    description: '当前运行环境。',
    example: 'development'
  })
  environment!: string;
}

/** 应用依赖就绪检查响应数据。 */
export class ReadinessResponseDto {
  /** 当前状态。 */
  @ApiProperty({
    type: String,
    enum: ['ready', 'not_ready'],
    description: '应用就绪状态。',
    example: 'ready'
  })
  status!: 'ready' | 'not_ready';
  /** 各项健康检查结果。 */
  @ApiProperty({
    type: 'object',
    additionalProperties: { type: 'string', enum: ['up', 'down'] },
    description: '依赖检查结果。',
    example: { database: 'up' }
  })
  checks!: Record<string, 'up' | 'down'>;
}
