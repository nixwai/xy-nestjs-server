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
  constructor(private readonly reflector: Reflector) {}

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

  private isExemptPath(path: string): boolean {
    return (
      path.endsWith('/health') ||
      path.endsWith('/health/ready') ||
      path.includes('/docs')
    );
  }
}
