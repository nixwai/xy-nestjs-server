import type { ConfigService } from '@nestjs/config';
import { constants, publicEncrypt } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { PasswordTransportService } from '#/common/security/password-transport.service.js';

function createService() {
  const encoded = process.env.AUTH_RSA_PRIVATE_KEY;
  if (!encoded) throw new Error('测试 RSA 私钥未加载');
  return new PasswordTransportService({ getOrThrow: () => encoded } as unknown as ConfigService);
}

describe('管理员密码传输加密', () => {
  it('返回公钥并解密 OAEP-SHA256 密文', () => {
    const service = createService();
    const ciphertext = publicEncrypt(
      { key: service.getPublicKey(), padding: constants.RSA_PKCS1_OAEP_PADDING, oaepHash: 'sha256' },
      Buffer.from('Admin1234')
    ).toString('base64');
    expect(service.decryptPassword(ciphertext)).toBe('Admin1234');
    expect(service.getPublicKey()).toContain('BEGIN PUBLIC KEY');
  });

  it('拒绝非法密文和不符合密码规则的明文', () => {
    const service = createService();
    expect(() => service.decryptPassword('not-base64')).toThrow('密码解密失败');
    const ciphertext = publicEncrypt(
      { key: service.getPublicKey(), padding: constants.RSA_PKCS1_OAEP_PADDING, oaepHash: 'sha256' },
      Buffer.from('short')
    ).toString('base64');
    expect(() => service.decryptPassword(ciphertext)).toThrow('密码长度不能少于8个字符');
  });
});
