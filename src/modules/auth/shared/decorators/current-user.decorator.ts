import type { ExecutionContext } from '@nestjs/common';
import { createParamDecorator } from '@nestjs/common';
import type { AuthenticatedRequest, UserJwtPayload } from '../types/jwt.types.js';

/** 从当前请求中提取已验证的微信用户身份。 */
export const CurrentUser = createParamDecorator((_data: unknown, context: ExecutionContext): UserJwtPayload => {
  const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
  return request.user as UserJwtPayload;
});
