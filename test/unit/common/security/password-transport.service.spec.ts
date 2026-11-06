import { ConfigService } from '@nestjs/config';
import { constants, createPublicKey, publicEncrypt } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { TEST_RSA_PRIVATE_KEY } from '../../../fixtures/rsa-key.js';
import { PasswordTransportService } from '#/common/security/password-transport.service.js';
/** 构造测试服务及其依赖 */
function createService(): PasswordTransportService {
  return new PasswordTransportService(new ConfigService({ auth: { rsaPrivateKey: TEST_RSA_PRIVATE_KEY } }));
}

/** 加密测试密码 */
function encrypt(publicKey: string, password: string): string {
  return publicEncrypt(
    {
      key: publicKey,
      padding: constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: 'sha256'
    },
    Buffer.from(password, 'utf8')
  ).toString('base64');
}

describe('PasswordTransportService', () => {
  it('derives a stable public key and decrypts RSA-OAEP-SHA256 passwords', () => {
    const first = createService();
    const second = createService();
    const publicKey = first.getPublicKey();

    expect(publicKey).toBe(second.getPublicKey());
    expect(createPublicKey(publicKey).asymmetricKeyType).toBe('rsa');
    expect(first.decryptPassword(encrypt(publicKey, 'Admin1234'))).toBe('Admin1234');
  });

  it('rejects malformed ciphertext without exposing crypto details', () => {
    const service = createService();

    expect(() => service.decryptPassword('not-a-ciphertext')).toThrow('密码解密失败');
    expect(() => service.decryptPassword('')).toThrow('密码解密失败');
  });

  it('validates decrypted password policy', () => {
    const service = createService();
    const publicKey = service.getPublicKey();

    expect(() => service.decryptPassword(encrypt(publicKey, 'short'))).toThrow('密码长度不能少于8个字符');
    expect(() => service.decryptPassword(encrypt(publicKey, 'onlyletters'))).toThrow('密码必须同时包含字母和数字');
  });
});
