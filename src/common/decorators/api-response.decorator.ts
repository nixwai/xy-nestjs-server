import { applyDecorators, type Type } from '@nestjs/common';
import { ApiExtraModels, ApiResponse, getSchemaPath } from '@nestjs/swagger';
import { ApiErrorResponseDto } from '../dto/api-error-response.dto.js';

interface ApiResponseDataOptions {
  description?: string;
}

const responseProperties = {
  code: {
    type: 'integer',
    description: '业务响应码，成功时为 0；失败时返回具体业务错误码。'
  },
  message: {
    type: 'string',
    description: '面向客户端的响应消息。'
  }
};

function createBusinessResponseSchema(data: Record<string, unknown>) {
  return {
    oneOf: [
      {
        type: 'object',
        required: ['code', 'message', 'data'],
        properties: {
          ...responseProperties,
          code: { ...responseProperties.code, example: 0, enum: [0] },
          message: { ...responseProperties.message, example: 'success' },
          data
        }
      },
      { $ref: getSchemaPath(ApiErrorResponseDto) }
    ]
  };
}

/** 为接口声明服务端错误响应。 */
export const ApiCommonResponses = () =>
  applyDecorators(
    ApiExtraModels(ApiErrorResponseDto),
    ApiResponse({
      status: 500,
      description: '服务器内部错误，响应体 code 固定为 50000。',
      content: {
        'application/json': {
          schema: { $ref: getSchemaPath(ApiErrorResponseDto) }
        }
      }
    })
  );
/** 描述 data 为单个业务对象的统一响应。 */
export const ApiOkResponseData = (model: Type<unknown>, options?: ApiResponseDataOptions) =>
  applyDecorators(
    ApiExtraModels(ApiErrorResponseDto, model),
    ApiResponse({
      status: 200,
      description: options?.description ?? '请求成功时返回 code=0；业务失败时仍返回 HTTP 200，并通过 code 判断结果。',
      content: {
        'application/json': {
          schema: createBusinessResponseSchema({
            $ref: getSchemaPath(model)
          })
        }
      }
    })
  );

/** 描述 data 为业务对象数组的统一响应。 */
export const ApiOkResponseList = (model: Type<unknown>, options?: ApiResponseDataOptions) =>
  applyDecorators(
    ApiExtraModels(ApiErrorResponseDto, model),
    ApiResponse({
      status: 200,
      description: options?.description ?? '请求成功时返回 code=0 和 data 数组；业务失败时通过 code 判断结果。',
      content: {
        'application/json': {
          schema: createBusinessResponseSchema({
            type: 'array',
            items: { $ref: getSchemaPath(model) }
          })
        }
      }
    })
  );

/** 描述 data 为 null 的统一响应。 */
export const ApiOkResponseEmpty = (options?: ApiResponseDataOptions) =>
  applyDecorators(
    ApiExtraModels(ApiErrorResponseDto),
    ApiResponse({
      status: 200,
      description: options?.description ?? '请求成功时返回 code=0 和 data=null；业务失败时通过 code 判断结果。',
      content: {
        'application/json': {
          schema: createBusinessResponseSchema({
            nullable: true,
            type: 'object',
            description: '无业务数据时固定为 null。',
            example: null
          })
        }
      }
    })
  );
