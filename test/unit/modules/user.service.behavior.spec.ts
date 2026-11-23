import { BadRequestException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { UserService } from '#/modules/user/user.service.js';
import type { UserRepository } from '#/modules/user/repositories/user-repository.port.js';
import type { AuditService } from '#/modules/audit/audit.service.js';

const user = {
  id: 'user-1',
  openId: 'openid-1',
  unionId: 'unionid-1',
  nickname: '旧昵称',
  avatarUrl: 'https://example.com/old.png',
  isActive: true,
  lastLoginAt: null,
  deletedAt: null,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01')
};

function createService(options: Partial<UserRepository> = {}) {
  const repository: Partial<UserRepository> = {
    findById: vi.fn().mockResolvedValue(user),
    findByOpenId: vi.fn().mockResolvedValue(null),
    list: vi.fn().mockResolvedValue({
      items: [user],
      total: 1,
      page: 1,
      pageSize: 20,
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: false
    }),
    create: vi.fn().mockResolvedValue(user),
    upsertByWechatIdentity: vi.fn().mockResolvedValue(user),
    update: vi.fn().mockResolvedValue(user),
    ...options
  };
  const auditService: Partial<AuditService> = { record: vi.fn().mockResolvedValue(undefined) };
  return {
    service: new UserService(repository as UserRepository, auditService as AuditService),
    repository,
    auditService
  };
}

describe('用户资料与状态业务', () => {
  it('列表和个人资料只返回公开用户字段', async () => {
    const { service } = createService();

    await expect(service.listUsers()).resolves.toMatchObject({
      items: [{ id: 'user-1', nickname: '旧昵称' }],
      total: 1
    });
    await expect(service.getProfile('user-1')).resolves.toMatchObject({ id: 'user-1', nickname: '旧昵称' });
  });

  it('不存在或停用用户分别返回资源缺失和认证失败', async () => {
    const missing = createService({ findById: vi.fn().mockResolvedValue(null) });
    await expect(missing.service.getProfile('missing')).rejects.toBeInstanceOf(NotFoundException);
    await expect(missing.service.findActiveUser('missing')).rejects.toBeInstanceOf(UnauthorizedException);

    const inactive = createService({ findById: vi.fn().mockResolvedValue({ ...user, isActive: false }) });
    await expect(inactive.service.findActiveUser('user-1')).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('微信身份幂等更新，停用身份不能重新登录', async () => {
    const { service, repository } = createService({
      findByOpenId: vi.fn().mockResolvedValue(user),
      upsertByWechatIdentity: vi.fn().mockResolvedValue({ ...user, nickname: '新昵称' })
    });
    await expect(service.upsertWechatUser({ openId: 'openid-1', nickname: '新昵称' })).resolves.toMatchObject({
      nickname: '新昵称'
    });
    expect(repository.upsertByWechatIdentity).toHaveBeenCalledOnce();

    const inactive = createService({ findByOpenId: vi.fn().mockResolvedValue({ ...user, isActive: false }) });
    await expect(inactive.service.upsertWechatUser({ openId: 'openid-1' })).rejects.toBeInstanceOf(
      UnauthorizedException
    );
  });

  it('更新资料时清理文本空白并拒绝空更新', async () => {
    const { service, repository, auditService } = createService();
    await expect(
      service.updateUser('admin-1', { id: 'user-1', nickname: '  新昵称  ', avatarUrl: '  ' })
    ).resolves.toMatchObject({ id: 'user-1' });
    expect(repository.update).toHaveBeenCalledWith('user-1', { nickname: '新昵称', avatarUrl: null });
    expect(auditService.record).toHaveBeenCalledWith(expect.objectContaining({ action: 'user.update' }));

    await expect(service.updateUser('admin-1', { id: 'user-1' })).rejects.toBeInstanceOf(BadRequestException);
    const missing = createService({ findById: vi.fn().mockResolvedValue(null) });
    await expect(missing.service.updateUser('admin-1', { id: 'missing', isActive: false })).rejects.toBeInstanceOf(
      NotFoundException
    );
  });
});
