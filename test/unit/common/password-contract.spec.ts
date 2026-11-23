import { describe, expect, it } from 'vitest';
import { hashPassword, verifyPassword } from '#/common/utils/password-hash.util.js';

describe('密码存储契约', () => {
  it('同一密码使用不同盐生成不同摘要，并只接受原密码', async () => {
    const first = await hashPassword('Admin1234');
    const second = await hashPassword('Admin1234');
    expect(first.salt).not.toBe(second.salt);
    expect(first.hash).not.toBe(second.hash);
    await expect(verifyPassword('Admin1234', first.hash, first.salt)).resolves.toBe(true);
    await expect(verifyPassword('Wrong1234', first.hash, first.salt)).resolves.toBe(false);
  });
});
