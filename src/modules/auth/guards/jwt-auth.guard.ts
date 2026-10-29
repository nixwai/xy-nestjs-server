import {
  UnauthorizedException,
  CanActivate,
  ExecutionContext,
  Injectable,
  Inject,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { AuthService } from '../auth.service.js';
import {
  JwtTokenService,
  type AdminJwtPayload,
} from '../tokens/jwt-token.service.js';
import { PUBLIC_ROUTE_KEY } from '../../authorization/decorators/index.js';

/** 校验访问令牌并将当前管理员身份写入请求。 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    @Inject(AuthService) private readonly authService: AuthService,
    @Inject(JwtTokenService) private readonly jwtTokenService: JwtTokenService,
    @Inject(Reflector) private readonly reflector?: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (
      typeof context.getHandler === 'function' &&
      this.reflector?.getAllAndOverride<boolean>(PUBLIC_ROUTE_KEY, [
        context.getHandler(),
        context.getClass(),
      ])
    )
      return true;
    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: AdminJwtPayload }>();
    const authorization = request.header('authorization');
    if (!authorization?.startsWith('Bearer ')) {
      throw new UnauthorizedException('请先登录');
    }
    const payload = this.jwtTokenService.verifyAccessToken(
      authorization.slice(7).trim(),
    );
    const admin = await this.authService.findActiveAdmin(payload.sub);
    request.user = { ...payload, isSuperAdmin: admin.isSuperAdmin };
    return true;
  }
}
