import { randomBytes, scrypt as nodeScrypt, timingSafeEqual } from 'node:crypto';
import type { PasswordHash } from '../types/password.types.js';

const KEY_LENGTH = 64;
const SALT_BYTES = 16;
const SCRYPT_OPTIONS = {
  N: 16_384,
  r: 8,
  p: 1,
  maxmem: 32 * 1024 * 1024
} as const;

/** 生成管理员密码的随机盐和 scrypt 哈希。 */
export async function hashPassword(password: string): Promise<PasswordHash> {
  const salt = randomBytes(SALT_BYTES);
  const derivedKey = await deriveKey(password, salt);
  return { hash: derivedKey.toString('hex'), salt: salt.toString('hex') };
}

/** 校验明文密码是否匹配已保存的哈希。 */
export async function verifyPassword(password: string, hash: string, salt: string): Promise<boolean> {
  try {
    const expected = Buffer.from(hash, 'hex');
    const actual = await deriveKey(password, Buffer.from(salt, 'hex'));
    return expected.length === actual.length && timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}

function deriveKey(password: string, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    nodeScrypt(password, salt, KEY_LENGTH, SCRYPT_OPTIONS, (error, derivedKey) => {
      if (error) {
        reject(error);
      } else resolve(derivedKey);
    });
  });
}
