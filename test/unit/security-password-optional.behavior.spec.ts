import { describe, expect, it } from 'vitest';
import type { ConfigService } from '@nestjs/config';
import { PasswordTransportService } from '#/common/security/password-transport.service.js';

describe('密码传输可选字段行为', () => {
  it('未提供可选当前密码时返回 undefined', () => {
    const encoded = process.env.AUTH_RSA_PRIVATE_KEY;
    if (!encoded) throw new Error('测试 RSA 私钥未加载');
    const service = new PasswordTransportService({ getOrThrow: () => encoded } as unknown as ConfigService);
    expect(service.decryptOptionalPassword(undefined)).toBeUndefined();
  });
});
