import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'node:crypto';
import type { AdminJwtPayload } from '../types/jwt.types.js';
import { decodeJson, encodeJson, isFiniteNumber, parseDuration } from '../utils/jwt.util.js';

/** 生成和校验管理员访问令牌。 */
@Injectable()
export class JwtTokenService {
  constructor(@Inject(ConfigService) private readonly configService: ConfigService) {}
  /** 签发短期管理员访问令牌。 */
  signAccessToken(adminId: string): string {
    const now = Math.floor(Date.now() / 1000);
    const expiresIn = parseDuration(this.configService.getOrThrow<string>('jwt.accessTokenExpiresIn'));
    const header = encodeJson({ alg: 'HS256', typ: 'JWT' });
    const payload = encodeJson({
      sub: adminId,
      role: 'admin',
      type: 'access',
      iat: now,
      exp: now + expiresIn
    });
    const unsignedToken = `${header}.${payload}`;
    const signature = createHmac('sha256', this.configService.getOrThrow<string>('jwt.secret'))
      .update(unsignedToken)
      .digest('base64url');
    return `${unsignedToken}.${signature}`;
  }
  /** 校验管理员访问令牌并返回可信身份。 */
  verifyAccessToken(token: string): AdminJwtPayload {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new UnauthorizedException('登录状态无效');
    }
    const [encodedHeader, encodedPayload, encodedSignature] = parts;
    const expectedSignature = createHmac('sha256', this.configService.getOrThrow<string>('jwt.secret'))
      .update(`${encodedHeader}.${encodedPayload}`)
      .digest('base64url');
    const actual = Buffer.from(encodedSignature, 'base64url');
    const expected = Buffer.from(expectedSignature, 'base64url');
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
      throw new UnauthorizedException('登录状态无效');
    }
    const header = decodeJson(encodedHeader);
    const payload = decodeJson(encodedPayload);
    if (
      header.alg !== 'HS256' ||
      header.typ !== 'JWT' ||
      typeof payload.sub !== 'string' ||
      payload.role !== 'admin' ||
      payload.type !== 'access' ||
      !isFiniteNumber(payload.iat) ||
      !isFiniteNumber(payload.exp) ||
      payload.exp <= Math.floor(Date.now() / 1000)
    )
      throw new UnauthorizedException('登录状态无效');
    return payload as unknown as AdminJwtPayload;
  }
}
