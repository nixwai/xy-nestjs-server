import type { Request } from 'express';

/** 访问令牌归属的身份类型。 */
export type AuthRole = 'admin' | 'user';

/** 已签发访问令牌中的通用身份信息。 */
export interface AuthJwtPayload {
  /** 身份主键。 */
  sub: string;
  /** 令牌归属的身份类型。 */
  role: AuthRole;
  /** 令牌用途类型。 */
  type: 'access';
  /** 签发时间的 Unix 秒级时间戳。 */
  iat: number;
  /** 过期时间的 Unix 秒级时间戳。 */
  exp: number;
  /** 签发时管理员是否为根管理员。 */
  isRoot?: boolean;
}

/** 携带已验证身份的 HTTP 请求。 */
export type AuthenticatedRequest = Request & {
  /** 当前登录身份。 */
  user?: AuthJwtPayload;
};
