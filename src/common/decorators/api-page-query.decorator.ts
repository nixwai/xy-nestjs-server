import { applyDecorators } from '@nestjs/common';
import { ApiQuery } from '@nestjs/swagger';

/** 为接口声明统一的页码分页查询参数。 */
export function ApiPageQuery(): MethodDecorator & ClassDecorator {
  return applyDecorators(
    ApiQuery({
      name: 'page',
      required: false,
      type: Number,
      example: 1,
      description: '页码，从 1 开始。',
    }),
    ApiQuery({
      name: 'pageSize',
      required: false,
      type: Number,
      example: 20,
      description: '每页条数，范围 1-100。',
    }),
  );
}
