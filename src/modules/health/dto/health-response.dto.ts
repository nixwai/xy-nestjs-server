import { ApiProperty } from '@nestjs/swagger';

/** 应用存活检查响应数据。 */
export class HealthResponseDto {
  @ApiProperty({
    type: String,
    enum: ['ok'],
    description: '服务状态。',
    example: 'ok'
  })
  status!: 'ok';

  @ApiProperty({
    type: String,
    description: '当前运行环境。',
    example: 'development'
  })
  environment!: string;
}

/** 应用依赖就绪检查响应数据。 */
export class ReadinessResponseDto {
  @ApiProperty({
    type: String,
    enum: ['ready', 'not_ready'],
    description: '应用就绪状态。',
    example: 'ready'
  })
  status!: 'ready' | 'not_ready';

  @ApiProperty({
    type: 'object',
    additionalProperties: { type: 'string', enum: ['up', 'down'] },
    description: '依赖检查结果。',
    example: { database: 'up' }
  })
  checks!: Record<string, 'up' | 'down'>;
}
