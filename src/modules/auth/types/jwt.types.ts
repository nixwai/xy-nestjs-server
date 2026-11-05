import type { Request } from 'express';

/** 已签发访问令牌中的管理员身份。 */
export interface AdminJwtPayload {
  /** 管理员 ID。 */
  sub: string;

  /** 令牌归属的身份类型。 */
  role: 'admin';

  /** 令牌用途类型。 */
  type: 'access';

  /** 签发时间的 Unix 秒级时间戳。 */
  iat: number;

  /** 过期时间的 Unix 秒级时间戳。 */
  exp: number;

  /** 签发时管理员是否为根管理员。 */
  isRoot?: boolean;
}

/** 携带已验证管理员身份的 HTTP 请求。 */
export type AuthenticatedRequest = Request & { user?: AdminJwtPayload };
