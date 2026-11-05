import { createHash, randomBytes } from 'node:crypto';

/** 创建不可预测的 Refresh Token。 */
export function createRefreshToken(): string {
  return randomBytes(48).toString('base64url');
}

/** 计算 Refresh Token 的不可逆存储摘要。 */
export function hashRefreshToken(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}
