import { ApiProperty } from '@nestjs/swagger';

/** 统一业务错误响应。 */
export class ApiErrorResponseDto {
  @ApiProperty({
    type: Number,
    enum: [40001, 40002, 40100, 40300, 40400, 40900, 42200, 42900, 50000],
    example: 40100,
    description:
      '业务错误码：40001 参数无效；40002 API 版本不支持；40100 未认证；40300 无权限；40400 资源不存在；40900 状态冲突；42200 业务校验失败；42900 请求过于频繁；50000 服务端错误。',
  })
  code!: number;

  @ApiProperty({
    type: String,
    example: '未通过身份认证',
    description: '面向客户端的错误消息。',
  })
  message!: string;

  @ApiProperty({
    type: 'object',
    additionalProperties: true,
    nullable: true,
    example: null,
    description: '错误响应固定为 null。',
  })
  data!: null;
}
