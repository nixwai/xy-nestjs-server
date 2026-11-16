import type { AuthJwtPayload } from '../../shared/types/jwt.types.js';

/** 已签发访问令牌中的管理员身份。 */
export type AdminJwtPayload = AuthJwtPayload & { role: 'admin' };
