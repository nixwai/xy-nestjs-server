import type { AuthJwtPayload } from '../../shared/types/jwt.types.js';

/** 已签发访问令牌中的微信用户身份。 */
export type UserJwtPayload = AuthJwtPayload & { role: 'user' };
