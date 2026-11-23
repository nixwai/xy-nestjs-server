import { describe, expect, it, vi } from 'vitest';
import { AdminAuthService } from '#/modules/auth/admin/admin-auth.service.js';
import type { AdminService } from '#/modules/admin/admin.service.js';
import type { AuthSessionRepository } from '#/modules/auth/admin/repositories/auth-session-repository.port.js';
import type { JwtTokenService } from '#/modules/auth/shared/tokens/jwt-token.service.js';
import type { ConfigService } from '@nestjs/config';
import { RefreshTokenInvalidException } from '#/modules/auth/shared/errors/index.js';
import { hashPassword } from '#/common/utils/password-hash.util.js';

const admin = {
  id: 'admin-1',
  username: 'admin',
  isRoot: false,
  isActive: true,
  passwordHash: '',
  passwordSalt: '',
  deletedAt: null,
  createdAt: new Date(),
  updatedAt: new Date()
};

function createService() {
  const adminService = {
    findByUsername: vi.fn().mockResolvedValue(admin),
    findById: vi.fn().mockResolvedValue(admin),
    createInitialAdmin: vi.fn().mockResolvedValue(admin)
  } as unknown as AdminService;
  const sessions = new Map<string, any>();
  const findByTokenHash = vi.fn(
    async (hash: string) => [...sessions.values()].find(item => item.tokenHash === hash) ?? null
  );
  const revokeByTokenHash = vi.fn(async (hash: string) => {
    const item = [...sessions.values()].find(item => item.tokenHash === hash);
    if (!item) return false;
    item.revokedAt = new Date();
    return true;
  });
  const createSession = vi.fn(async (input: any) => {
    const item = {
      id: String(sessions.size + 1),
      ...input,
      revokedAt: null,
      replacedBySessionId: null,
      createdAt: new Date(),
      lastUsedAt: null
    };
    sessions.set(item.id, item);
    return item;
  });
  const sessionRepository: AuthSessionRepository = {
    findByTokenHash,
    create: createSession,
    rotate: vi.fn(async (id, replacement, now) => {
      const current = sessions.get(id);
      if (!current || current.revokedAt) return { status: 'replayed' } as const;
      const next = await sessionRepository.create(replacement);
      sessions.set(id, { ...current, revokedAt: now, replacedBySessionId: next.id });
      return { status: 'rotated', session: next } as const;
    }),
    revokeByTokenHash,
    revokeBySessionFamilyId: vi.fn().mockResolvedValue(undefined),
    deleteExpiredFamilies: vi.fn().mockResolvedValue(0)
  };
  const config = {
    getOrThrow: vi.fn((key: string) =>
      key.endsWith('accessTokenExpiresIn') ? '15m' : key.endsWith('refreshTokenExpiresIn') ? '7d' : 'test-secret'
    )
  } as unknown as ConfigService;
  const jwt = { signAccessToken: vi.fn((id: string, role: string) => `${role}:${id}`) } as unknown as JwtTokenService;
  return {
    service: new AdminAuthService(adminService, sessionRepository, config, jwt),
    adminService,
    sessionRepository,
    jwt,
    createSession,
    revokeByTokenHash
  };
}

describe('管理员认证服务', () => {
  it('验证密码后签发访问令牌和刷新会话', async () => {
    const credentials = await hashPassword('Admin1234');
    const context = createService();
    (context.adminService.findByUsername as ReturnType<typeof vi.fn>).mockResolvedValue({
      ...admin,
      passwordHash: credentials.hash,
      passwordSalt: credentials.salt
    });

    const result = await context.service.login('admin', 'Admin1234');

    expect(result).toMatchObject({ tokenType: 'Bearer', admin: { id: 'admin-1', role: 'admin' } });
    expect(context.createSession).toHaveBeenCalledOnce();
  });

  it('错误密码或停用账号不能登录', async () => {
    const context = createService();
    const credentials = await hashPassword('Admin1234');
    (context.adminService.findByUsername as ReturnType<typeof vi.fn>).mockResolvedValue({
      ...admin,
      passwordHash: credentials.hash,
      passwordSalt: credentials.salt
    });
    await expect(context.service.login('admin', 'Wrong1234')).rejects.toThrow('用户名或密码错误');
    (context.adminService.findByUsername as ReturnType<typeof vi.fn>).mockResolvedValue({ ...admin, isActive: false });
    await expect(context.service.login('admin', 'Admin1234')).rejects.toThrow('用户名或密码错误');
  });

  it('刷新令牌轮换，未知或重放令牌返回专用失效异常', async () => {
    const context = createService();
    await expect(context.service.refresh('unknown')).rejects.toBeInstanceOf(RefreshTokenInvalidException);
    const credentials = await hashPassword('Admin1234');
    (context.adminService.findByUsername as ReturnType<typeof vi.fn>).mockResolvedValue({
      ...admin,
      passwordHash: credentials.hash,
      passwordSalt: credentials.salt
    });
    const login = await context.service.login('admin', 'Admin1234');
    const refreshed = await context.service.refresh(login.refreshToken);
    expect(refreshed.refreshToken).not.toBe(login.refreshToken);
    await expect(context.service.refresh(login.refreshToken)).rejects.toBeInstanceOf(RefreshTokenInvalidException);
  });

  it('注销幂等并撤销刷新会话', async () => {
    const context = createService();
    await expect(context.service.logout('missing')).resolves.toBeNull();
    expect(context.revokeByTokenHash).toHaveBeenCalledOnce();
  });

  it('停用账号刷新时撤销会话族并返回失效异常', async () => {
    const context = createService();
    const current = {
      id: 'session-1',
      adminId: 'admin-1',
      sessionFamilyId: 'family-1',
      tokenHash: 'hash',
      expiresAt: new Date(Date.now() + 60_000),
      revokedAt: null,
      replacedBySessionId: null,
      createdAt: new Date(),
      lastUsedAt: null
    };
    (context.sessionRepository.findByTokenHash as ReturnType<typeof vi.fn>).mockResolvedValue(current);
    (context.adminService.findById as ReturnType<typeof vi.fn>).mockResolvedValue({ ...admin, isActive: false });

    await expect(context.service.refresh('refresh-token')).rejects.toBeInstanceOf(RefreshTokenInvalidException);
    expect(context.sessionRepository.revokeBySessionFamilyId).toHaveBeenCalledWith('family-1', expect.any(Date));
  });

  it('创建首个管理员、查询可用状态和验证密码分别遵守业务契约', async () => {
    const context = createService();
    const credentials = await hashPassword('Admin1234');
    (context.adminService.findById as ReturnType<typeof vi.fn>).mockResolvedValue({
      ...admin,
      passwordHash: credentials.hash,
      passwordSalt: credentials.salt
    });
    const created = await context.service.createInitialAdmin('root', 'Admin1234');

    expect(created).toBeDefined();
    expect(context.adminService.createInitialAdmin).toHaveBeenCalledWith(expect.objectContaining({ username: 'root' }));
    await expect(context.service.findActiveAdmin('admin-1')).resolves.toMatchObject({ id: 'admin-1' });
    await expect(context.service.verifyAdminPassword('admin-1', 'Admin1234')).resolves.toBe(true);
    await expect(context.service.verifyAdminPassword('admin-1', 'Wrong1234')).resolves.toBe(false);
  });

  it('查询停用或不存在管理员时拒绝访问', async () => {
    const context = createService();
    (context.adminService.findById as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    await expect(context.service.findActiveAdmin('missing')).rejects.toThrow('登录状态无效');
    (context.adminService.findById as ReturnType<typeof vi.fn>).mockResolvedValue({ ...admin, isActive: false });
    await expect(context.service.findActiveAdmin('admin-1')).rejects.toThrow('登录状态无效');
  });
});
