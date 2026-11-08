import type { CanActivate, ExecutionContext } from '@nestjs/common';
import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ADMIN_ROLE_KEY } from '../decorators/admin-only.decorator.js';
import type { AuthenticatedRequest } from '../types/jwt.types.js';
/** 校验当前请求是否携带管理员身份。 */
@Injectable()
export class AdminRoleGuard implements CanActivate {
  /** 创建当前实例。 */
  constructor(@Inject(Reflector) private readonly reflector: Reflector) {}

  /** 拒绝非管理员身份访问管理员路由。 */
  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<boolean>(ADMIN_ROLE_KEY, [
      context.getHandler(),
      context.getClass()
    ]);
    if (!required) {
      return true;
    }
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (!request.user?.sub) {
      throw new ForbiddenException('无权访问');
    }
    return true;
  }
}
