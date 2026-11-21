import type { CanActivate, ExecutionContext } from '@nestjs/common';
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PUBLIC_ROUTE_KEY } from '#/modules/authorization/decorators/index.js';
import { UserService } from '#/modules/user/user.service.js';
import { AdminAuthService } from '../admin/admin-auth.service.js';
import { JwtTokenService } from '../shared/tokens/jwt-token.service.js';
import type { AuthenticatedRequest } from '../shared/types/jwt.types.js';

/** 校验访问令牌并将当前管理员或用户身份写入请求。 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  /** 创建当前实例。 */
  constructor(
    @Inject(AdminAuthService) private readonly adminAuthService: AdminAuthService,
    @Inject(JwtTokenService) private readonly jwtTokenService: JwtTokenService,
    @Inject(UserService) private readonly userService: UserService,
    @Inject(Reflector) private readonly reflector?: Reflector
  ) {}

  /** canActivate。 */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (
      typeof context.getHandler === 'function' &&
      this.reflector?.getAllAndOverride<boolean>(PUBLIC_ROUTE_KEY, [context.getHandler(), context.getClass()])
    ) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authorization = request.header('authorization');
    if (!authorization?.startsWith('Bearer ')) {
      throw new UnauthorizedException('请先登录');
    }

    const payload = this.jwtTokenService.verifyAccessToken(authorization.slice(7).trim());
    if (payload.role === 'admin') {
      const admin = await this.adminAuthService.findActiveAdmin(payload.sub);
      request.user = { ...payload, isRoot: admin.isRoot };
      return true;
    }

    await this.userService.findActiveUser(payload.sub);
    request.user = { ...payload };
    return true;
  }
}
