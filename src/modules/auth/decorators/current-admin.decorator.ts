import type { ExecutionContext } from '@nestjs/common';
import { createParamDecorator } from '@nestjs/common';
import type { AdminJwtPayload, AuthenticatedRequest } from '../types/jwt.types.js';

/** 从当前请求中提取已验证的管理员身份。 */
export const CurrentAdmin = createParamDecorator((_data: unknown, context: ExecutionContext): AdminJwtPayload => {
  const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
  return request.user as AdminJwtPayload;
});
