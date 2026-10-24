import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { HttpCode } from '../enums/index.js';
import type { ApiErrorResponse } from '../types/index.js';

/** 将异常转换为统一 API 错误响应。 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<Request>();
    const isHttpException = exception instanceof HttpException;
    const status = isHttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;
    const body = isHttpException ? exception.getResponse() : undefined;
    const message = this.getMessage(body, status);
    const businessCode = this.getBusinessCode(body, status);

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(`${request.method} ${request.path}`, exception);
      response.status(HttpStatus.INTERNAL_SERVER_ERROR);
    } else {
      response.status(HttpStatus.OK);
    }

    const payload: ApiErrorResponse = {
      code: businessCode,
      message,
      data: null,
    };
    response.json(payload);
  }

  private getMessage(
    body: string | object | undefined,
    status: number,
  ): string {
    if (typeof body === 'string') {
      return body;
    }
    if (body && typeof body === 'object' && 'message' in body) {
      const message = body.message;
      return Array.isArray(message) ? message.join('; ') : String(message);
    }
    return status >= 500 ? '服务器内部错误' : '请求处理失败';
  }

  private getBusinessCode(
    body: string | object | undefined,
    status: number,
  ): number {
    if (body && typeof body === 'object' && 'code' in body) {
      const code = body.code;
      if (typeof code === 'number') {
        return code;
      }
    }
    return status >= 500
      ? HttpCode.INTERNAL_SERVER_ERROR
      : this.statusToBusinessCode(status);
  }

  private statusToBusinessCode(status: number): number {
    const mapping: Record<number, number> = {
      400: HttpCode.BAD_REQUEST,
      401: HttpCode.UNAUTHORIZED,
      403: HttpCode.FORBIDDEN,
      404: HttpCode.NOT_FOUND,
      409: HttpCode.CONFLICT,
      422: HttpCode.UNPROCESSABLE_ENTITY,
      429: HttpCode.TOO_MANY_REQUESTS,
    };
    return mapping[status] ?? HttpCode.BAD_REQUEST;
  }
}
