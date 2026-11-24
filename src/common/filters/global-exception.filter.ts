import type { ArgumentsHost, ExceptionFilter } from '@nestjs/common';
import { Catch, HttpException, HttpStatus, Logger } from '@nestjs/common';
import type { Request, Response } from 'express';
import { HttpCode } from '../enums/index.js';
import { DomainConflictError, DomainNotFoundError, PublicBusinessException } from '../errors/index.js';
import { getMysqlDuplicateKey } from '../utils/index.js';
import type { ApiErrorResponse } from '../types/index.js';
/** 定义 ErrorResponseBody 数据结构。 */
type ErrorResponseBody = Record<string, unknown>;
/** 定义客户端 HTTP 状态对应的业务码与默认中文文案。 */
interface HttpStatusMeta {
  /** 对外业务错误码。 */
  readonly code: HttpCode;
  /** 面向客户端的默认中文文案。 */
  readonly message: string;
}

const HTTP_STATUS_META: Readonly<Record<number, HttpStatusMeta>> = Object.freeze({
  [HttpStatus.BAD_REQUEST]: { code: HttpCode.BAD_REQUEST, message: '请求参数错误' },
  [HttpStatus.UNAUTHORIZED]: { code: HttpCode.UNAUTHORIZED, message: '登录状态已失效，请重新登录' },
  [HttpStatus.FORBIDDEN]: { code: HttpCode.FORBIDDEN, message: '无权访问' },
  [HttpStatus.NOT_FOUND]: { code: HttpCode.NOT_FOUND, message: '请求的资源不存在' },
  [HttpStatus.CONFLICT]: { code: HttpCode.CONFLICT, message: '请求与当前资源冲突' },
  [HttpStatus.METHOD_NOT_ALLOWED]: { code: HttpCode.BAD_REQUEST, message: '请求方法不被允许' },
  [HttpStatus.UNPROCESSABLE_ENTITY]: { code: HttpCode.UNPROCESSABLE_ENTITY, message: '请求参数校验失败' },
  [HttpStatus.PAYLOAD_TOO_LARGE]: { code: HttpCode.BAD_REQUEST, message: '请求内容过大' },
  [HttpStatus.UNSUPPORTED_MEDIA_TYPE]: { code: HttpCode.BAD_REQUEST, message: '请求格式不受支持' },
  [HttpStatus.TOO_MANY_REQUESTS]: { code: HttpCode.TOO_MANY_REQUESTS, message: '请求过于频繁，请稍后重试' }
});

const UNKNOWN_CLIENT_STATUS_META: HttpStatusMeta = Object.freeze({
  code: HttpCode.BAD_REQUEST,
  message: '请求处理失败'
});

const DUPLICATE_KEY_LABELS: Readonly<Record<string, string>> = Object.freeze({
  username: '用户名',
  tokenHash: '令牌',
  adminRole: '管理员角色关系',
  roleCode: '角色编码',
  permissionCode: '权限编码',
  rolePermission: '角色权限关系',
  uniqueKey: '唯一字段'
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
        message: `${DUPLICATE_KEY_LABELS[duplicateKey] ?? '字段'}已存在`,
        data: null
      });
      return;
    }

    const status = this.getHttpStatus(exception);
    const isClientError = status >= HttpStatus.BAD_REQUEST && status < 500;

    if (!isClientError) {
      this.logger.error(`${this.getRequestContext(request)} ${this.getExceptionName(exception)}`);
      this.sendError(response, HttpStatus.INTERNAL_SERVER_ERROR, {
        code: HttpCode.INTERNAL_SERVER_ERROR,
        message: '服务器内部错误',
        data: null
      });
      return;
    }

    const meta = this.getStatusMeta(status);

    if (exception instanceof PublicBusinessException) {
      response.status(HttpStatus.OK).json({
        code: exception.code,
        message: this.getClientMessage(exception.getResponse(), meta),
        data: exception.data
      });
      return;
    }

    const body = this.getExceptionBody(exception);
    const payload: ApiErrorResponse = {
      code: this.getBusinessCode(body, meta),
      message: this.getClientMessage(body, meta),
      data: null
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
    if (exception instanceof DomainNotFoundError || exception instanceof DomainConflictError) {
      return exception.message;
    }
    return undefined;
  }

  /** 获取客户端状态对应的业务码与默认中文文案。 */
  private getStatusMeta(status: number): HttpStatusMeta {
    return HTTP_STATUS_META[status] ?? UNKNOWN_CLIENT_STATUS_META;
  }

  /** 从异常响应体中提取并安全转换客户端可见消息。 */
  private getClientMessage(body: unknown, meta: HttpStatusMeta): string {
    const messages = this.extractMessages(body);
    if (!messages.length) {
      return meta.message;
    }
    return messages.map(message => this.translateClientMessage(message, meta)).join('; ');
  }

  /** 提取异常响应中的一条或多条消息。 */
  private extractMessages(body: unknown): string[] {
    if (typeof body === 'string' && body.trim()) {
      return [body.trim()];
    }
    if (!this.isErrorResponseBody(body)) {
      return [];
    }
    if (typeof body.message === 'string' && body.message.trim()) {
      return [body.message.trim()];
    }
    if (Array.isArray(body.message)) {
      return body.message.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
    }
    return [];
  }

  /** 透传中文业务消息，非中文消息统一替换为状态默认中文文案。 */
  private translateClientMessage(message: string, meta: HttpStatusMeta): string {
    if (/[\u4e00-\u9fff]/.test(message)) {
      return message;
    }
    return meta.message;
  }

  /** 从异常响应体中提取显式业务码，未提供时使用状态默认业务码。 */
  private getBusinessCode(body: unknown, meta: HttpStatusMeta): number {
    if (this.isErrorResponseBody(body)) {
      const code = body.code;
      if (typeof code === 'number' && Number.isSafeInteger(code) && code > 0) {
        return code;
      }
    }

    return meta.code;
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
  private sendError(response: Response, status: number, payload: ApiErrorResponse): void {
    response.status(status);
    response.json(payload);
  }
}
