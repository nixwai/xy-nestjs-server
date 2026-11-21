import { UnauthorizedException } from '@nestjs/common';

/** JWT 有效期单位对应的秒数。 */
const DURATION_UNIT_SECONDS: Readonly<Record<string, number>> = Object.freeze({
  s: 1,
  m: 60,
  h: 3600,
  d: 86400
});

/**
 * 解析 JWT 有效期配置。
 *
 * @param value - 形如 `30m`、`12h`、`7d` 的有效期配置。
 * @returns 有效期对应的秒数。
 * @throws 配置格式不受支持时抛出 Error。
 */
export function parseDuration(value: string): number {
  const match = /^(\d+)(s|m|h|d)$/.exec(value.trim());
  if (!match) {
    throw new Error('JWT 有效期配置无效');
  }
  return Number(match[1]) * DURATION_UNIT_SECONDS[match[2]];
}

/** 将 JWT 段对象编码为 Base64URL 字符串。 */
export function encodeJson(value: object): string {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}

/**
 * 解码 JWT 段内容。
 *
 * @param value - Base64URL 编码的 JWT 段。
 * @returns 解码后的对象字段。
 * @throws 内容不是 JSON 对象时抛出 UnauthorizedException。
 */
export function decodeJson(value: string): Record<string, unknown> {
  try {
    const decoded: unknown = JSON.parse(Buffer.from(value, 'base64url').toString('utf8'));
    if (!decoded || typeof decoded !== 'object' || Array.isArray(decoded)) {
      throw new Error('invalid payload');
    }
    return decoded as Record<string, unknown>;
  } catch {
    throw new UnauthorizedException('登录状态无效');
  }
}

/** 判断值是否为有限数字。 */
export function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}
