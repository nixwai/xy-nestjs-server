import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import type { AdminJwtPayload } from '../tokens/jwt-token.service.js';

/** 从当前请求中提取已验证的管理员身份。 */
export const CurrentAdmin = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AdminJwtPayload => {
    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: AdminJwtPayload }>();
    return request.user as AdminJwtPayload;
  },
);
