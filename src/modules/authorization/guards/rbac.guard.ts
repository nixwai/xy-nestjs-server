import type { CanActivate, ExecutionContext } from '@nestjs/common';
import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import type { AdminJwtPayload } from '#/modules/auth/tokens/jwt-token.service.js';
import { AuthorizationService } from '../authorization.service.js';
import {
  PERMISSION_KEY,
  PUBLIC_ROUTE_KEY,
  SUPER_ADMIN_ONLY_KEY,
  type RequiredPermission
} from '../decorators/index.js';
import { HttpMethod, PermissionResource } from '../enums/index.js';
import { isHttpMethod } from '../utils/http-method.util.js';

/** 对业务路由执行统一授权判断。 */
@Injectable()
export class RbacGuard implements CanActivate {
  constructor(
    @Inject(Reflector) private readonly reflector: Reflector,
    @Inject(AuthorizationService) private readonly authorizationService: AuthorizationService
  ) {}
  /** 校验当前请求权限。 */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 是否公共接口
    if (this.reflector.getAllAndOverride<boolean>(PUBLIC_ROUTE_KEY, [context.getHandler(), context.getClass()])) {
      return true;
    }
    // 是否配置权限
    const required = this.reflector.getAllAndOverride<RequiredPermission | undefined>(PERMISSION_KEY, [
      context.getHandler(),
      context.getClass()
    ]);
    if (!required) {
      throw new ForbiddenException('接口未配置访问权限');
    }
    const request = context.switchToHttp().getRequest<Request & { user?: AdminJwtPayload }>();
    const method = request.method.toUpperCase();
    if (!isHttpMethod(method)) {
      throw new ForbiddenException('不支持的请求方法');
    }
    // 是否超管接口
    const superAdminOnly = this.reflector.getAllAndOverride<boolean>(SUPER_ADMIN_ONLY_KEY, [
      context.getHandler(),
      context.getClass()
    ]);
    if (superAdminOnly && !request.user?.isSuperAdmin) {
      throw new ForbiddenException('仅超级管理员可执行');
    }

    // 无需配置权限的接口
    if (required.resource === PermissionResource.ADMIN_SELF && method === HttpMethod.GET) {
      return true;
    }

    // 判断是否有权限
    if (!request.user?.sub) {
      throw new ForbiddenException('无权访问');
    }
    const hasPermission = await this.authorizationService.hasPermission(request.user.sub, required.resource, method);
    if (!hasPermission) {
      throw new ForbiddenException('无权访问');
    }
    return true;
  }
}
