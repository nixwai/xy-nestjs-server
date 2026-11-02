import { describe, expect, it } from 'vitest';
import { hashPassword, verifyPassword } from '../../../../../src/modules/auth/utils/password.util.js';

describe('password utilities', () => {
  it('uses a different salt for the same password', async () => {
    const first = await hashPassword('Admin1234');
    const second = await hashPassword('Admin1234');
    expect(first.salt).not.toBe(second.salt);
    expect(first.hash).not.toBe(second.hash);
  });

  it('verifies only the original password', async () => {
    const saved = await hashPassword('Admin1234');
    await expect(verifyPassword('Admin1234', saved.hash, saved.salt)).resolves.toBe(true);
    await expect(verifyPassword('Wrong1234', saved.hash, saved.salt)).resolves.toBe(false);
  });
});
