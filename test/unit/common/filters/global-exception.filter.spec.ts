import {
  ArgumentsHost,
  BadRequestException,
  HttpException,
  HttpStatus,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { describe, expect, it, vi } from 'vitest';
import { HttpCode } from '../../../../src/common/enums/index.js';
import {
  DomainConflictError,
  DomainNotFoundError,
} from '../../../../src/common/errors/index.js';
import { GlobalExceptionFilter } from '../../../../src/common/filters/global-exception.filter.js';

interface ResponseMock {
  status: ReturnType<typeof vi.fn>;
  json: ReturnType<typeof vi.fn>;
}

function createHost(
  request: Partial<{ method: string; path: string; originalUrl: string }> = {},
): { host: ArgumentsHost; response: ResponseMock } {
  const response: ResponseMock = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn(),
  };
  const host = {
    switchToHttp: () => ({
      getRequest: () => ({
        method: 'GET',
        path: '/api/admin',
        originalUrl: '/api/admin',
        ...request,
      }),
      getResponse: () => response,
    }),
  } as unknown as ArgumentsHost;

  return { host, response };
}

function createQueryFailedError(
  driverError: Error & {
    code?: string;
    errno?: number;
    sqlMessage?: string;
  },
): QueryFailedError {
  return new QueryFailedError('INSERT INTO secret_table', [], driverError);
}

describe('GlobalExceptionFilter', () => {
  it('应将客户端 HttpException 转换为 HTTP 200 业务错误响应', () => {
    const { host, response } = createHost();

    new GlobalExceptionFilter().catch(
      new BadRequestException('请求参数错误'),
      host,
    );

    expect(response.status).toHaveBeenCalledWith(HttpStatus.OK);
    expect(response.json).toHaveBeenCalledWith({
      code: HttpCode.BAD_REQUEST,
      message: '请求参数错误',
      data: null,
    });
  });

  it('应合并参数校验异常中的多条消息', () => {
    const { host, response } = createHost();
    const exception = new BadRequestException({
      message: ['用户名不能为空', '密码长度不足'],
    });

    new GlobalExceptionFilter().catch(exception, host);

    expect(response.json).toHaveBeenCalledWith({
      code: HttpCode.BAD_REQUEST,
      message: '用户名不能为空; 密码长度不足',
      data: null,
    });
  });

  it('应优先使用异常响应体中的显式业务码', () => {
    const { host, response } = createHost();
    const exception = new HttpException(
      { code: HttpCode.UNSUPPORTED_VERSION, message: '版本不受支持' },
      HttpStatus.UNSUPPORTED_MEDIA_TYPE,
    );

    new GlobalExceptionFilter().catch(exception, host);

    expect(response.json).toHaveBeenCalledWith({
      code: HttpCode.UNSUPPORTED_VERSION,
      message: '版本不受支持',
      data: null,
    });
  });

  it('应将领域异常转换为对应的业务错误', () => {
    const filter = new GlobalExceptionFilter();
    const { host, response } = createHost();

    filter.catch(new DomainNotFoundError('管理员'), host);
    expect(response.json).toHaveBeenCalledWith({
      code: HttpCode.NOT_FOUND,
      message: '管理员不存在',
      data: null,
    });

    filter.catch(new DomainConflictError('管理员用户名'), host);
    expect(response.json).toHaveBeenLastCalledWith({
      code: HttpCode.CONFLICT,
      message: '管理员用户名已存在',
      data: null,
    });
  });

  it('应将 MySQL 重复键异常转换为冲突响应', () => {
    const { host, response } = createHost();
    const error = createQueryFailedError(
      Object.assign(new Error('Duplicate entry'), {
        code: 'ER_DUP_ENTRY',
        sqlMessage: "Duplicate entry 'admin' for key 'uk_admin_username'",
      }),
    );

    new GlobalExceptionFilter().catch(error, host);

    expect(response.status).toHaveBeenCalledWith(HttpStatus.OK);
    expect(response.json).toHaveBeenCalledWith({
      code: HttpCode.CONFLICT,
      message: '用户名已存在',
      data: null,
    });
  });

  it('应将框架默认英文异常转换为中文', () => {
    const { host, response } = createHost();

    new GlobalExceptionFilter().catch(
      new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED),
      host,
    );

    expect(response.json).toHaveBeenCalledWith({
      code: HttpCode.UNAUTHORIZED,
      message: '请先登录',
      data: null,
    });
  });

  it('应隐藏未知英文客户端异常消息', () => {
    const { host, response } = createHost();

    new GlobalExceptionFilter().catch(
      new HttpException('database failure', HttpStatus.BAD_REQUEST),
      host,
    );

    expect(response.json).toHaveBeenCalledWith({
      code: HttpCode.BAD_REQUEST,
      message: '请求参数错误',
      data: null,
    });
  });

  it('应隐藏服务端 HttpException 的敏感消息并返回 HTTP 500', () => {
    const { host, response } = createHost();

    new GlobalExceptionFilter().catch(
      new InternalServerErrorException('数据库密码 secret'),
      host,
    );

    expect(response.status).toHaveBeenCalledWith(
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
    expect(response.json).toHaveBeenCalledWith({
      code: HttpCode.INTERNAL_SERVER_ERROR,
      message: '服务器内部错误',
      data: null,
    });
  });

  it('应记录不包含查询参数的服务端异常上下文', () => {
    const loggerSpy = vi
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);

    new GlobalExceptionFilter().catch(
      new Error('internal failure'),
      createHost({
        path: '/api/health',
        originalUrl: '/api/health?access_token=secret',
      }).host,
    );

    expect(loggerSpy).toHaveBeenCalledWith('GET /api/health Error');
    expect(loggerSpy.mock.calls[0]?.[0]).not.toContain('access_token=secret');
    loggerSpy.mockRestore();
  });

  it('应将非客户端错误状态按服务端异常处理', () => {
    const { host, response } = createHost();

    new GlobalExceptionFilter().catch(
      new HttpException('异常状态', HttpStatus.MOVED_PERMANENTLY),
      host,
    );

    expect(response.status).toHaveBeenCalledWith(
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
    expect(response.json).toHaveBeenCalledWith({
      code: HttpCode.INTERNAL_SERVER_ERROR,
      message: '服务器内部错误',
      data: null,
    });
  });

  it('应为未覆盖的客户端状态码使用安全的通用业务码', () => {
    const { host, response } = createHost();

    new GlobalExceptionFilter().catch(
      new HttpException('请求被拒绝', 418),
      host,
    );

    expect(response.json).toHaveBeenCalledWith({
      code: HttpCode.BAD_REQUEST,
      message: '请求被拒绝',
      data: null,
    });
  });
});
