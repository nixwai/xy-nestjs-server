import { describe, expect, it } from 'vitest';
import { InMemoryUserRepository } from '#/modules/user/repositories/in-memory-user.repository.js';

describe('InMemoryUserRepository', () => {
  it('可创建不绑定外部登录身份的开发用户', async () => {
    const repository = new InMemoryUserRepository();

    const created = await repository.create({
      openId: null,
      unionId: null,
      nickname: 'H5开发用户',
      lastLoginAt: new Date('2026-11-15T02:00:00.000Z')
    });

    expect(created).toMatchObject({
      openId: null,
      unionId: null,
      nickname: 'H5开发用户',
      isActive: true
    });
  });

  it('按微信 openId 幂等创建并更新用户资料', async () => {
    const repository = new InMemoryUserRepository();

    const created = await repository.upsertByWechatIdentity({
      openId: 'openid-1',
      unionId: 'unionid-1',
      nickname: '初始用户',
      avatarUrl: 'https://example.com/avatar.png',
      lastLoginAt: new Date('2026-11-15T00:00:00.000Z')
    });
    const updated = await repository.upsertByWechatIdentity({
      openId: 'openid-1',
      nickname: '更新用户',
      lastLoginAt: new Date('2026-11-15T01:00:00.000Z')
    });

    expect(updated.id).toBe(created.id);
    expect(updated).toMatchObject({
      openId: 'openid-1',
      unionId: 'unionid-1',
      nickname: '更新用户',
      avatarUrl: 'https://example.com/avatar.png'
    });
    expect(updated.lastLoginAt).toEqual(new Date('2026-11-15T01:00:00.000Z'));
  });

  it('支持关键词和状态筛选，并在停用后仍可查询记录', async () => {
    const repository = new InMemoryUserRepository();
    const target = await repository.upsertByWechatIdentity({ openId: 'openid-target', nickname: '目标用户' });
    await repository.upsertByWechatIdentity({ openId: 'openid-other', nickname: '其他用户' });
    await repository.update(target.id, { isActive: false });

    await expect(
      repository.list({ page: 1, pageSize: 20, skip: 0, keyword: '目标', isActive: false })
    ).resolves.toMatchObject({
      total: 1,
      items: [{ id: target.id, nickname: '目标用户', isActive: false }]
    });
    await expect(repository.findByOpenId('openid-target')).resolves.toMatchObject({ id: target.id, isActive: false });
  });
});
