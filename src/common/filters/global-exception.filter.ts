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
import { DomainConflictError, DomainNotFoundError } from '../errors/index.js';
import { getMysqlDuplicateKey } from '../utils/index.js';
import type { ApiErrorResponse } from '../types/index.js';

type ErrorResponseBody = Record<string, unknown>;

const HTTP_STATUS_TO_BUSINESS_CODE: Readonly<Record<number, HttpCode>> =
  Object.freeze({
    [HttpStatus.BAD_REQUEST]: HttpCode.BAD_REQUEST,
    [HttpStatus.UNAUTHORIZED]: HttpCode.UNAUTHORIZED,
    [HttpStatus.FORBIDDEN]: HttpCode.FORBIDDEN,
    [HttpStatus.NOT_FOUND]: HttpCode.NOT_FOUND,
    [HttpStatus.CONFLICT]: HttpCode.CONFLICT,
    [HttpStatus.UNPROCESSABLE_ENTITY]: HttpCode.UNPROCESSABLE_ENTITY,
    [HttpStatus.TOO_MANY_REQUESTS]: HttpCode.TOO_MANY_REQUESTS,
  });

/** 将异常转换为项目统一的 API 错误响应。 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter<unknown> {
  /** 记录未预期的服务端异常。 */
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  /**
   * 捕获请求处理期间的异常，并按项目约定返回统一错误结构。
   *
   * @param exception - 请求处理期间抛出的异常。
   * @param host - 当前请求的 Nest 执行上下文。
   */
  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<Request>();
    const duplicateKey = getMysqlDuplicateKey(exception);

    if (duplicateKey) {
      this.sendError(response, HttpStatus.OK, {
        code: HttpCode.CONFLICT,
        message: `${duplicateKey}已存在`,
        data: null,
      });
      return;
    }

    const status = this.getHttpStatus(exception);
    const isClientError = status >= HttpStatus.BAD_REQUEST && status < 500;

    if (!isClientError) {
      this.logger.error(
        `${this.getRequestContext(request)} ${this.getExceptionName(exception)}`,
      );
      this.sendError(response, HttpStatus.INTERNAL_SERVER_ERROR, {
        code: HttpCode.INTERNAL_SERVER_ERROR,
        message: '服务器内部错误',
        data: null,
      });
      return;
    }

    const body = this.getExceptionBody(exception);
    const payload: ApiErrorResponse = {
      code: this.getBusinessCode(body, status),
      message: this.getClientMessage(body),
      data: null,
    };

    this.sendError(response, HttpStatus.OK, payload);
  }

  /** 获取异常对应的 HTTP 状态码。 */
  private getHttpStatus(exception: unknown): number {
    if (exception instanceof HttpException) {
      return exception.getStatus();
    }
    if (exception instanceof DomainNotFoundError) {
      return HttpStatus.NOT_FOUND;
    }
    if (exception instanceof DomainConflictError) {
      return HttpStatus.CONFLICT;
    }
    return HttpStatus.INTERNAL_SERVER_ERROR;
  }

  /** 获取异常中允许用于客户端响应的内容。 */
  private getExceptionBody(exception: unknown): unknown {
    if (exception instanceof HttpException) {
      return exception.getResponse();
    }
    if (
      exception instanceof DomainNotFoundError ||
      exception instanceof DomainConflictError
    ) {
      return exception.message;
    }
    return undefined;
  }

  /** 从异常响应体中提取客户端可见消息。 */
  private getClientMessage(body: unknown): string {
    if (typeof body === 'string' && body.trim()) {
      return body;
    }

    if (!this.isErrorResponseBody(body)) {
      return '请求处理失败';
    }

    const message = body.message;
    if (typeof message === 'string' && message.trim()) {
      return message;
    }

    if (Array.isArray(message)) {
      const messages = message.filter(
        (item): item is string =>
          typeof item === 'string' && item.trim().length > 0,
      );
      if (messages.length > 0) {
        return messages.join('; ');
      }
    }

    return '请求处理失败';
  }

  /** 从异常响应体中提取显式业务码，未提供时按 HTTP 状态码映射。 */
  private getBusinessCode(body: unknown, status: number): number {
    if (this.isErrorResponseBody(body)) {
      const code = body.code;
      if (typeof code === 'number' && Number.isSafeInteger(code) && code > 0) {
        return code;
      }
    }

    return HTTP_STATUS_TO_BUSINESS_CODE[status] ?? HttpCode.BAD_REQUEST;
  }

  /** 返回不包含异常消息和堆栈的日志标识，避免记录敏感内容。 */
  private getExceptionName(exception: unknown): string {
    if (exception instanceof Error) {
      return exception.name;
    }
    return typeof exception;
  }

  /** 生成不包含查询参数的请求日志上下文。 */
  private getRequestContext(request: Request): string {
    const method = request.method || 'UNKNOWN';
    const path = request.path || request.originalUrl?.split('?')[0] || '/';
    return `${method} ${path}`;
  }

  /** 判断值是否为可读取错误字段的对象。 */
  private isErrorResponseBody(value: unknown): value is ErrorResponseBody {
    return typeof value === 'object' && value !== null;
  }

  /** 写入统一错误响应。 */
  private sendError(
    response: Response,
    status: number,
    payload: ApiErrorResponse,
  ): void {
    response.status(status);
    response.json(payload);
  }
}
