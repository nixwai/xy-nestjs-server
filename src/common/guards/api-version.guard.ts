import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnsupportedMediaTypeException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { ApiVersion, HttpCode } from '../enums/index.js';

/** 校验业务 API 使用受支持的 Accept 版本头。 */
@Injectable()
export class ApiVersionGuard implements CanActivate {
  constructor(
    /** 读取路由上的版本校验豁免元数据。 */
    private readonly reflector: Reflector,
  ) {}

  /**
   * 校验当前请求是否携带受支持的 API 版本头。
   *
   * @param context - 当前请求执行上下文。
   * @returns 请求是否允许继续处理。
   * @throws 当业务请求缺少受支持的版本头时抛出异常。
   */
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const path = request.path;
    if (
      this.isExemptPath(path) ||
      this.reflector.get<boolean>('skipApiVersion', context.getHandler())
    ) {
      return true;
    }

    const accept = request.header('accept');
    if (accept !== ApiVersion.V1) {
      throw new UnsupportedMediaTypeException({
        code: HttpCode.UNSUPPORTED_VERSION,
        message: `必须使用 Accept: ${ApiVersion.V1}`,
      });
    }
    return true;
  }

  /** 判断请求路径是否属于版本校验豁免范围。 */
  private isExemptPath(path: string): boolean {
    return (
      path.endsWith('/health') ||
      path.endsWith('/health/ready') ||
      path.includes('/docs')
    );
  }
}
