import { describe, expect, it } from 'vitest';
import { InMemoryAuthSessionRepository } from '#/modules/auth/admin/repositories/in-memory-auth-session.repository.js';

const now = new Date('2026-11-21T00:00:00.000Z');
const cutoff = new Date('2026-11-14T00:00:00.000Z');

describe('InMemoryAuthSessionRepository', () => {
  it('按会话族撤销并批量删除已过期会话', async () => {
    const repository = new InMemoryAuthSessionRepository();
    const oldToken = await repository.create({
      adminId: '1',
      sessionFamilyId: 'old-family',
      tokenHash: 'old-token-hash',
      expiresAt: new Date('2026-11-01T00:00:00.000Z')
    });
    const oldReplacement = await repository.create({
      adminId: '1',
      sessionFamilyId: 'old-family',
      tokenHash: 'old-replacement-hash',
      expiresAt: new Date('2026-11-02T00:00:00.000Z')
    });
    await repository.create({
      adminId: '1',
      sessionFamilyId: 'active-family',
      tokenHash: 'active-token-hash',
      expiresAt: new Date('2026-12-01T00:00:00.000Z')
    });

    await repository.revokeBySessionFamilyId(oldToken.sessionFamilyId, now);

    expect(await repository.deleteExpiredFamilies(now, cutoff, 100)).toBe(2);
    await expect(repository.findByTokenHash(oldToken.tokenHash)).resolves.toBeNull();
    await expect(repository.findByTokenHash(oldReplacement.tokenHash)).resolves.toBeNull();
    await expect(repository.findByTokenHash('active-token-hash')).resolves.toMatchObject({
      sessionFamilyId: 'active-family',
      revokedAt: null
    });
  });
});
