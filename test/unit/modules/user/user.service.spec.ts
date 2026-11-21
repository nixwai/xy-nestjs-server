import { NotFoundException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { UserService } from '#/modules/user/user.service.js';
import type { UserRepository } from '#/modules/user/repositories/user-repository.port.js';
import type { UserRecord } from '#/modules/user/types/user.types.js';
import type { AuditService } from '#/modules/audit/audit.service.js';

function user(overrides: Partial<UserRecord> = {}): UserRecord {
  const now = new Date('2026-11-15T00:00:00.000Z');
  return {
    id: '1',
    openId: 'openid-1',
    unionId: null,
    nickname: '用户',
    avatarUrl: null,
    isActive: true,
    lastLoginAt: now,
    deletedAt: null,
    createdAt: now,
    updatedAt: now,
    ...overrides
  };
}

function createService(repository: Partial<UserRepository> = {}) {
  const auditRecordMock = vi.fn().mockResolvedValue(undefined);
  const updateMock = vi.fn().mockResolvedValue(user({ isActive: false }));
  const auditService = { record: auditRecordMock } as unknown as AuditService;
  const userRepository = {
    findById: vi.fn().mockResolvedValue(user()),
    list: vi.fn().mockResolvedValue({
      items: [user()],
      total: 1,
      page: 1,
      pageSize: 20,
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: false
    }),
    update: updateMock,
    ...repository
  } as UserRepository;
  return { service: new UserService(userRepository, auditService), updateMock, auditRecordMock };
}

describe('UserService', () => {
  it('更新用户状态并记录管理员审计', async () => {
    const { service, auditRecordMock, updateMock } = createService();

    const result = await service.updateUser('admin-1', {
      id: '1',
      isActive: false
    });

    expect(result).toMatchObject({ id: '1', isActive: false });
    expect(updateMock).toHaveBeenCalledWith('1', { isActive: false });
    expect(auditRecordMock).toHaveBeenCalledWith(
      expect.objectContaining({
        actorAdminId: 'admin-1',
        action: 'user.update',
        resourceType: 'user',
        targetId: '1'
      })
    );
  });

  it('支持清空昵称和头像资料', async () => {
    const { service, updateMock } = createService();

    await service.updateUser('admin-1', { id: '1', nickname: null, avatarUrl: null });

    expect(updateMock).toHaveBeenCalledWith('1', { nickname: null, avatarUrl: null });
  });
  it('用户不存在时拒绝更新', async () => {
    const { service } = createService({ findById: vi.fn().mockResolvedValue(null) });

    await expect(service.updateUser('admin-1', { id: 'missing', isActive: false })).rejects.toBeInstanceOf(
      NotFoundException
    );
  });
});
