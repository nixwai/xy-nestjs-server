import type { ExecutionContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { describe, expect, it, vi } from 'vitest';
import { AdminService } from '#/modules/admin/admin.service.js';
import { InMemoryAdminRepository } from '#/modules/admin/repositories/in-memory-admin.repository.js';
import { InMemoryAdminTransactionRunner } from '#/modules/admin/repositories/in-memory-admin-transaction-runner.js';
import { AuditService } from '#/modules/audit/audit.service.js';
import { AdminAuthService } from '#/modules/auth/admin/admin-auth.service.js';
import { AdminRoleGuard } from '#/modules/auth/shared/guards/admin-role.guard.js';
import { JwtAuthGuard } from '#/modules/auth/shared/guards/jwt-auth.guard.js';
import { InMemoryAuthSessionRepository } from '#/modules/auth/admin/repositories/in-memory-auth-session.repository.js';
import { JwtTokenService } from '#/modules/auth/shared/tokens/jwt-token.service.js';
import { InMemoryUserRepository } from '#/modules/user/repositories/in-memory-user.repository.js';
import { UserService } from '#/modules/user/user.service.js';
import type { RoleService } from '#/modules/role/role.service.js';

const config = new ConfigService({
  jwt: {
    secret: 'test-only-secret-with-at-least-32-chars',
    accessTokenExpiresIn: '15m',
    refreshTokenExpiresIn: '7d'
  }
});

/** 构造守卫测试上下文 */
function contextFor(authorization?: string, user?: object): ExecutionContext {
  const request = {
    user,
    header: () => authorization
  };
  return {
    getHandler: () => () => undefined,
    getClass: () => class TestController {},
    switchToHttp: () => ({ getRequest: () => request })
  } as unknown as ExecutionContext;
}

/** 构造管理员认证服务 */
function createAdminAuthService(): AdminAuthService {
  const repository = new InMemoryAdminRepository();
  const adminService = new AdminService(
    repository,
    {
      findByCode: async () => null,
      findById: async () => null
    } as unknown as RoleService,
    new AuditService(),
    new InMemoryAdminTransactionRunner(repository)
  );
  return new AdminAuthService(adminService, new InMemoryAuthSessionRepository(), config, new JwtTokenService(config));
}

/** 构造用户资料服务 */
function createUserService() {
  const repository = new InMemoryUserRepository();
  const service = new UserService(repository, { record: vi.fn() } as never);
  return { repository, service };
}

describe('JwtAuthGuard', () => {
  it('应放行标记为公共接口的路由', async () => {
    const reflector = {
      getAllAndOverride: vi.fn().mockReturnValue(true)
    };
    const guard = new JwtAuthGuard(
      createAdminAuthService(),
      new JwtTokenService(config),
      createUserService().service,
      reflector as never
    );

    await expect(guard.canActivate(contextFor())).resolves.toBe(true);
  });

  it('应验证访问令牌并写入当前管理员身份', async () => {
    const authService = createAdminAuthService();
    await authService.createInitialAdmin('admin', 'Admin1234');
    const tokenService = new JwtTokenService(config);
    const token = tokenService.signAccessToken('1', 'admin');
    const guard = new JwtAuthGuard(authService, tokenService, createUserService().service);
    const request = { header: () => `Bearer ${token}` } as {
      /** 当前用户。 */
      user?: object;
    };
    const context = {
      switchToHttp: () => ({ getRequest: () => request })
    } as unknown as ExecutionContext;

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(request.user).toMatchObject({ sub: '1', role: 'admin', isRoot: true });
  });

  it('应验证访问令牌并写入当前微信用户身份', async () => {
    const { repository, service: userService } = createUserService();
    const user = await repository.upsertByWechatIdentity({ openId: 'openid-1' });
    const tokenService = new JwtTokenService(config);
    const token = tokenService.signAccessToken(user.id, 'user');
    const guard = new JwtAuthGuard(createAdminAuthService(), tokenService, userService);
    const request = { header: () => `Bearer ${token}` } as {
      /** 当前用户。 */
      user?: object;
    };
    const context = {
      switchToHttp: () => ({ getRequest: () => request })
    } as unknown as ExecutionContext;

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(request.user).toMatchObject({ sub: user.id, role: 'user' });
    expect(request.user).not.toHaveProperty('isRoot');
  });

  it('停用微信用户的访问令牌应被拒绝', async () => {
    const { repository, service: userService } = createUserService();
    const user = await repository.upsertByWechatIdentity({ openId: 'openid-disabled' });
    await repository.update(user.id, { isActive: false });
    const tokenService = new JwtTokenService(config);
    const token = tokenService.signAccessToken(user.id, 'user');
    const guard = new JwtAuthGuard(createAdminAuthService(), tokenService, userService);

    await expect(guard.canActivate(contextFor(`Bearer ${token}`))).rejects.toThrow('登录状态无效');
  });
});

describe('AdminRoleGuard', () => {
  it('未标记管理员路由时应放行', () => {
    const reflector = { getAllAndOverride: vi.fn().mockReturnValue(false) };
    const guard = new AdminRoleGuard(reflector as never);

    expect(guard.canActivate(contextFor())).toBe(true);
  });

  it('标记管理员路由但缺少身份时应拒绝', () => {
    const reflector = { getAllAndOverride: vi.fn().mockReturnValue(true) };
    const guard = new AdminRoleGuard(reflector as never);

    expect(() => guard.canActivate(contextFor())).toThrow('无权访问');
  });

  it('标记管理员路由但携带用户身份时应拒绝', () => {
    const reflector = { getAllAndOverride: vi.fn().mockReturnValue(true) };
    const guard = new AdminRoleGuard(reflector as never);

    expect(() => guard.canActivate(contextFor(undefined, { sub: '1', role: 'user' }))).toThrow('无权访问');
  });

  it('标记管理员路由但管理员身份缺少主体 ID 时应拒绝', () => {
    const reflector = { getAllAndOverride: vi.fn().mockReturnValue(true) };
    const guard = new AdminRoleGuard(reflector as never);

    expect(() => guard.canActivate(contextFor(undefined, { role: 'admin' }))).toThrow('无权访问');
  });
});
