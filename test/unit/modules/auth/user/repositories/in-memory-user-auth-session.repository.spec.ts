import { describe, expect, it } from 'vitest';
import { InMemoryUserAuthSessionRepository } from '#/modules/auth/user/repositories/in-memory-user-auth-session.repository.js';

const now = new Date('2026-11-21T00:00:00.000Z');
const cutoff = new Date('2026-11-14T00:00:00.000Z');

describe('InMemoryUserAuthSessionRepository', () => {
  it('不会删除仍有有效令牌的会话族', async () => {
    const repository = new InMemoryUserAuthSessionRepository();
    const session = await repository.create({
      userId: '1',
      sessionFamilyId: 'family-1',
      tokenHash: 'token-hash',
      expiresAt: new Date('2026-12-01T00:00:00.000Z')
    });

    expect(await repository.deleteExpiredFamilies(now, cutoff, 100)).toBe(0);
    await expect(repository.findByTokenHash(session.tokenHash)).resolves.toMatchObject({
      sessionFamilyId: 'family-1',
      revokedAt: null
    });
  });
});
