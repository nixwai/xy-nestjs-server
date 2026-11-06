import type { ExecutionContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { describe, expect, it, vi } from 'vitest';
import { AdminService } from '#/modules/admin/admin.service.js';
import { InMemoryAdminRepository } from '#/modules/admin/repositories/in-memory-admin.repository.js';
import { InMemoryAdminTransactionRunner } from '#/modules/admin/repositories/in-memory-admin-transaction-runner.js';
import { AuditService } from '#/modules/audit/audit.service.js';
import { AuthService } from '#/modules/auth/auth.service.js';
import { AdminRoleGuard } from '#/modules/auth/guards/admin-role.guard.js';
import { JwtAuthGuard } from '#/modules/auth/guards/jwt-auth.guard.js';
import { InMemoryAuthSessionRepository } from '#/modules/auth/repositories/in-memory-auth-session.repository.js';
import { JwtTokenService } from '#/modules/auth/tokens/jwt-token.service.js';
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

/** 构造认证服务 */
function createAuthService(): AuthService {
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
  return new AuthService(adminService, new InMemoryAuthSessionRepository(), config, new JwtTokenService(config));
}

describe('JwtAuthGuard', () => {
  it('应放行标记为公共接口的路由', async () => {
    const reflector = {
      getAllAndOverride: vi.fn().mockReturnValue(true)
    };
    const guard = new JwtAuthGuard(createAuthService(), new JwtTokenService(config), reflector as never);

    await expect(guard.canActivate(contextFor())).resolves.toBe(true);
  });

  it('应验证访问令牌并写入当前管理员身份', async () => {
    const authService = createAuthService();
    await authService.createInitialAdmin('admin', 'Admin1234');
    const tokenService = new JwtTokenService(config);
    const token = tokenService.signAccessToken('1');
    const guard = new JwtAuthGuard(authService, tokenService);
    const request = { header: () => `Bearer ${token}` } as {
      /** 当前用户。 */
      user?: object;
    };
    const context = {
      switchToHttp: () => ({ getRequest: () => request })
    } as unknown as ExecutionContext;

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(request.user).toMatchObject({ sub: '1', isRoot: true });
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
});
