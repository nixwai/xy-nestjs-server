import type { CanActivate, ExecutionContext } from '@nestjs/common';
import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { AuthenticatedRequest } from '#/modules/auth/types/jwt.types.js';
import { AuthorizationService } from '../authorization.service.js';
import { AUTHENTICATED_ROUTE_KEY, PERMISSION_KEY, PUBLIC_ROUTE_KEY, ROOT_ONLY_KEY } from '../decorators/index.js';

/** 对业务路由执行统一授权判断。 */
@Injectable()
export class RbacGuard implements CanActivate {
  constructor(
    @Inject(Reflector) private readonly reflector: Reflector,
    @Inject(AuthorizationService) private readonly authorizationService: AuthorizationService
  ) {}

  /** 校验当前请求的登录状态和动态授权规则。 */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const handler = context.getHandler();
    const controller = context.getClass();
    if (this.reflector.getAllAndOverride<boolean>(PUBLIC_ROUTE_KEY, [handler, controller])) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;
    if (!user?.sub) {
      throw new ForbiddenException('无权访问');
    }

    const rootOnly = this.reflector.getAllAndOverride<boolean>(ROOT_ONLY_KEY, [handler, controller]);
    if (rootOnly) {
      if (!user.isRoot) {
        throw new ForbiddenException('仅根管理员可执行');
      }
      return true;
    }

    const requiredPermission = this.reflector.getAllAndOverride<string | undefined>(PERMISSION_KEY, [
      handler,
      controller
    ]);
    if (requiredPermission) {
      const hasPermission = await this.authorizationService.hasPermission(user.sub, requiredPermission);
      if (!hasPermission) {
        throw new ForbiddenException('无权访问');
      }
      return true;
    }

    if (this.reflector.getAllAndOverride<boolean>(AUTHENTICATED_ROUTE_KEY, [handler, controller])) {
      return true;
    }

    throw new ForbiddenException('接口未配置访问权限');
  }
}
