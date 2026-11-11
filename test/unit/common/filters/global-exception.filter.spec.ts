import type { ArgumentsHost } from '@nestjs/common';
import { BadRequestException, HttpException, HttpStatus, InternalServerErrorException, Logger } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { describe, expect, it, vi } from 'vitest';
import { HttpCode } from '#/common/enums/index.js';
import { PublicBusinessException } from '#/common/errors/public-business.exception.js';
import { DomainConflictError, DomainNotFoundError } from '#/common/errors/index.js';
import { AssetBatchUploadException } from '#/modules/asset/errors/asset-batch-upload.exception.js';
import { GlobalExceptionFilter } from '#/common/filters/global-exception.filter.js';
/** 定义 ResponseMock 数据契约。 */
interface ResponseMock {
  /** 当前状态。 */
  status: ReturnType<typeof vi.fn>;
  /** JSON 响应方法。 */
  json: ReturnType<typeof vi.fn>;
}

/** 构造异常过滤器测试上下文 */
function createHost(
  request: Partial<{
    /** 请求方法。 */
    method: string;
    /** 请求路径。 */
    path: string;
    /** 原始请求地址。 */
    originalUrl: string;
  }> = {}
): {
  /** 请求上下文。 */
  host: ArgumentsHost;
  /** HTTP 响应对象。 */
  response: ResponseMock;
} {
  const response: ResponseMock = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn()
  };
  const host = {
    switchToHttp: () => ({
      getRequest: () => ({
        method: 'GET',
        path: '/api/admin',
        originalUrl: '/api/admin',
        ...request
      }),
      getResponse: () => response
    })
  } as unknown as ArgumentsHost;

  return { host, response };
}

/** 构造数据库查询异常 */
function createQueryFailedError(
  driverError: Error & {
    /** 业务编码。 */
    code?: string;
    /** 数据库错误编号。 */
    errno?: number;
    /** 数据库错误消息。 */
    sqlMessage?: string;
  }
): QueryFailedError {
  return new QueryFailedError('INSERT INTO secret_table', [], driverError);
}

describe('GlobalExceptionFilter', () => {
  it('应将客户端 HttpException 转换为 HTTP 200 业务错误响应', () => {
    const { host, response } = createHost();

    new GlobalExceptionFilter().catch(new BadRequestException('请求参数错误'), host);

    expect(response.status).toHaveBeenCalledWith(HttpStatus.OK);
    expect(response.json).toHaveBeenCalledWith({
      code: HttpCode.BAD_REQUEST,
      message: '请求参数错误',
      data: null
    });
  });

  it('应合并参数校验异常中的多条消息', () => {
    const { host, response } = createHost();
    const exception = new BadRequestException({
      message: ['用户名不能为空', '密码长度不足']
    });

    new GlobalExceptionFilter().catch(exception, host);

    expect(response.json).toHaveBeenCalledWith({
      code: HttpCode.BAD_REQUEST,
      message: '用户名不能为空; 密码长度不足',
      data: null
    });
  });

  it('应将领域异常转换为对应的业务错误', () => {
    const filter = new GlobalExceptionFilter();
    const { host, response } = createHost();

    filter.catch(new DomainNotFoundError('管理员'), host);
    expect(response.json).toHaveBeenCalledWith({
      code: HttpCode.NOT_FOUND,
      message: '管理员不存在',
      data: null
    });

    filter.catch(new DomainConflictError('管理员用户名'), host);
    expect(response.json).toHaveBeenLastCalledWith({
      code: HttpCode.CONFLICT,
      message: '管理员用户名已存在',
      data: null
    });
  });

  it('应将 MySQL 重复键异常转换为冲突响应', () => {
    const { host, response } = createHost();
    const error = createQueryFailedError(
      Object.assign(new Error('Duplicate entry'), {
        code: 'ER_DUP_ENTRY',
        sqlMessage: "Duplicate entry 'admin' for key 'uk_admin_username'"
      })
    );

    new GlobalExceptionFilter().catch(error, host);

    expect(response.status).toHaveBeenCalledWith(HttpStatus.OK);
    expect(response.json).toHaveBeenCalledWith({
      code: HttpCode.CONFLICT,
      message: '用户名已存在',
      data: null
    });
  });

  it('应将框架默认英文异常转换为中文', () => {
    const { host, response } = createHost();

    new GlobalExceptionFilter().catch(new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED), host);

    expect(response.json).toHaveBeenCalledWith({
      code: HttpCode.UNAUTHORIZED,
      message: '请先登录',
      data: null
    });
  });

  it('应隐藏未知英文客户端异常消息', () => {
    const { host, response } = createHost();

    new GlobalExceptionFilter().catch(new HttpException('database failure', HttpStatus.BAD_REQUEST), host);

    expect(response.json).toHaveBeenCalledWith({
      code: HttpCode.BAD_REQUEST,
      message: '请求参数错误',
      data: null
    });
  });

  it('应隐藏服务端 HttpException 的敏感消息并返回 HTTP 500', () => {
    const { host, response } = createHost();

    new GlobalExceptionFilter().catch(new InternalServerErrorException('数据库密码 secret'), host);

    expect(response.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(response.json).toHaveBeenCalledWith({
      code: HttpCode.INTERNAL_SERVER_ERROR,
      message: '服务器内部错误',
      data: null
    });
  });

  it('应记录不包含查询参数的服务端异常上下文', () => {
    const loggerSpy = vi.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);

    new GlobalExceptionFilter().catch(
      new Error('internal failure'),
      createHost({
        path: '/api/health',
        originalUrl: '/api/health?access_token=secret'
      }).host
    );

    expect(loggerSpy).toHaveBeenCalledWith('GET /api/health Error');
    expect(loggerSpy.mock.calls[0]?.[0]).not.toContain('access_token=secret');
    loggerSpy.mockRestore();
  });

  it('应将非客户端错误状态按服务端异常处理', () => {
    const { host, response } = createHost();

    new GlobalExceptionFilter().catch(new HttpException('异常状态', HttpStatus.MOVED_PERMANENTLY), host);

    expect(response.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(response.json).toHaveBeenCalledWith({
      code: HttpCode.INTERNAL_SERVER_ERROR,
      message: '服务器内部错误',
      data: null
    });
  });

  it('应为未覆盖的客户端状态码使用安全的通用业务码', () => {
    const { host, response } = createHost();

    new GlobalExceptionFilter().catch(new HttpException('请求被拒绝', 418), host);

    expect(response.json).toHaveBeenCalledWith({
      code: HttpCode.BAD_REQUEST,
      message: '请求被拒绝',
      data: null
    });
  });
});

describe('素材全部上传失败的安全明细', () => {
  it('只返回专用异常允许的字段并清理内部失败原因', () => {
    const { host, response } = createHost();
    new GlobalExceptionFilter().catch(
      new AssetBatchUploadException({
        success: [],
        failed: [{ filename: 'a.png', reason: 'SQL secret /var/private' }],
        totalCount: 1,
        successCount: 0
      }),
      host
    );
    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.json).toHaveBeenCalledWith({
      code: 40001,
      message: '所有图片上传失败',
      data: {
        success: [],
        failed: [{ filename: 'a.png', reason: '图片上传失败' }],
        totalCount: 1,
        successCount: 0
      }
    });
  });
  it('普通异常不能借 data 注入内容', () => {
    const { host, response } = createHost();
    new GlobalExceptionFilter().catch(
      new BadRequestException({ message: '上传失败', data: { secret: 'secret' } }),
      host
    );
    expect(response.json).toHaveBeenCalledWith({ code: 40001, message: '上传失败', data: null });
  });
});

describe('素材安全失败原因', () => {
  it.each(['素材保存失败，请稍后重试', '图片上传失败，请稍后重试', '图片格式、大小、目录或操作权限不符合要求'])(
    '保留已脱敏原因 %s',
    reason => {
      const { host, response } = createHost();
      const exception = new AssetBatchUploadException({
        success: [],
        failed: [{ filename: 'a.png', reason }],
        totalCount: 1,
        successCount: 0
      });
      new GlobalExceptionFilter().catch(exception, host);
      expect(exception.details.failed).toEqual([{ filename: 'a.png', reason }]);
      expect(response.json).toHaveBeenCalledWith({
        code: 40001,
        message: '所有图片上传失败',
        data: { success: [], failed: [{ filename: 'a.png', reason }], totalCount: 1, successCount: 0 }
      });
    }
  );
});

/** 测试公共异常能力，不依赖具体业务模块的数据结构。 */
class PublicExampleException extends PublicBusinessException<Readonly<{ field: string }>> {
  constructor(input: { field: string; secret?: string }) {
    super('字段校验失败', Object.freeze({ field: input.field }));
  }
}

describe('可公开业务异常边界', () => {
  it('过滤器识别公共基类并遵循异常持有的白名单，不透传输入额外字段', () => {
    const { host, response } = createHost();
    const exception = new PublicExampleException({ field: '名称', secret: 'private' });
    new GlobalExceptionFilter().catch(exception, host);
    expect(exception.getStatus()).toBe(400);
    expect(exception.code).toBe(HttpCode.BAD_REQUEST);
    expect(exception.data).toBe(exception.details);
    expect(response.json).toHaveBeenCalledWith({ code: 40001, message: '字段校验失败', data: { field: '名称' } });
    expect(response.json.mock.calls[0]?.[0].data).toBe(exception.details);
  });
  it('素材异常构造时一次归一化，data 与 details 是同一只读真源', () => {
    const input = {
      success: [],
      failed: [{ filename: 'C:\\private\\a.png\n', reason: 'SQL secret', secret: 'private' }],
      totalCount: 99,
      successCount: 7,
      secret: 'private'
    };
    const exception = new AssetBatchUploadException(input);
    expect(exception).toBeInstanceOf(PublicBusinessException);
    expect(exception.details).toEqual({
      success: [],
      failed: [{ filename: 'a.png', reason: '图片上传失败' }],
      totalCount: 1,
      successCount: 0
    });
    expect(exception.data).toBe(exception.details);
    expect(Object.isFrozen(exception.details)).toBe(true);
    expect(Object.isFrozen(exception.details.failed)).toBe(true);
    expect(Object.isFrozen(exception.details.failed[0])).toBe(true);
    input.failed[0]!.reason = 'mutated secret';
    const { host, response } = createHost();
    new GlobalExceptionFilter().catch(exception, host);
    expect(response.json.mock.calls[0]?.[0].data).toBe(exception.details);
    expect(exception.data.failed[0]?.reason).toBe('图片上传失败');
  });
  it('普通 HttpException 的同名 details/data 均不能透传', () => {
    const { host, response } = createHost();
    const exception = Object.assign(new BadRequestException({ message: '拒绝请求', data: { secret: 'private' } }), {
      details: { secret: 'private' },
      data: { secret: 'private' }
    });
    new GlobalExceptionFilter().catch(exception, host);
    expect(response.json).toHaveBeenCalledWith({ code: 40001, message: '拒绝请求', data: null });
  });
});
