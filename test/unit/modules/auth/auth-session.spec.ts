import { describe, expect, it } from 'vitest';
import { createRefreshToken, hashRefreshToken } from '#/modules/auth/shared/utils/refresh-token.util.js';
import { InMemoryAuthSessionRepository } from '#/modules/auth/admin/repositories/in-memory-auth-session.repository.js';

const now = new Date('2026-11-21T00:00:00.000Z');

describe('刷新令牌会话生命周期', () => {
  it('生成不可预测令牌并只保存摘要', () => {
    const token = createRefreshToken();

    expect(token).toHaveLength(64);
    expect(hashRefreshToken(token)).toMatch(/^[a-f0-9]{64}$/);
    expect(hashRefreshToken(token)).not.toBe(token);
  });

  it('轮换会话后旧会话重放并标记为 revoked', async () => {
    const repository = new InMemoryAuthSessionRepository();
    const current = await repository.create({
      adminId: '1',
      sessionFamilyId: 'family-1',
      tokenHash: 'old-hash',
      expiresAt: new Date('2026-12-01T00:00:00.000Z')
    });
    const replacement = await repository.rotate(
      current.id,
      {
        adminId: '1',
        sessionFamilyId: 'family-1',
        tokenHash: 'new-hash',
        expiresAt: new Date('2026-12-02T00:00:00.000Z')
      },
      now
    );

    expect(replacement.status).toBe('rotated');
    expect(
      (
        await repository.rotate(
          current.id,
          {
            adminId: '1',
            sessionFamilyId: 'family-1',
            tokenHash: 'another-hash',
            expiresAt: new Date('2026-12-03T00:00:00.000Z')
          },
          now
        )
      ).status
    ).toBe('replayed');
    expect(await repository.findByTokenHash('old-hash')).toMatchObject({ revokedAt: now });
  });

  it('删除已撤销且超过保留期的会话族，不影响活动会话', async () => {
    const repository = new InMemoryAuthSessionRepository();
    const old = await repository.create({
      adminId: '1',
      sessionFamilyId: 'old-family',
      tokenHash: 'old-hash',
      expiresAt: new Date('2026-11-01T00:00:00.000Z')
    });
    await repository.revokeByTokenHash(old.tokenHash, now);
    await repository.create({
      adminId: '1',
      sessionFamilyId: 'active-family',
      tokenHash: 'active-hash',
      expiresAt: new Date('2026-12-01T00:00:00.000Z')
    });

    expect(await repository.deleteExpiredFamilies(now, new Date('2026-11-14T00:00:00.000Z'), 10)).toBe(1);
    await expect(repository.findByTokenHash('old-hash')).resolves.toBeNull();
    await expect(repository.findByTokenHash('active-hash')).resolves.toMatchObject({ revokedAt: null });
  });
});
