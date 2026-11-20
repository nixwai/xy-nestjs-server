import { UnauthorizedException } from '@nestjs/common';
import { HttpCode } from '#/common/enums/index.js';

/** 表示 Refresh Token 已过期、撤销、重放或不存在。 */
export class RefreshTokenInvalidException extends UnauthorizedException {
  constructor() {
    super({ code: HttpCode.REFRESH_TOKEN_INVALID, message: '刷新令牌无效' });
  }
}
