import type { ExecutionContext } from '@nestjs/common';
import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { describe, expect, it, vi } from 'vitest';
import { AdminService } from '#/modules/admin/admin.service.js';
import { InMemoryAdminRepository } from '#/modules/admin/repositories/in-memory-admin.repository.js';
import { InMemoryAdminTransactionRunner } from '#/modules/admin/repositories/in-memory-admin-transaction-runner.js';
import { AuditService } from '#/modules/audit/audit.service.js';
import { AdminAuthService } from '#/modules/auth/admin/admin-auth.service.js';
import { InMemoryAuthSessionRepository } from '#/modules/auth/admin/repositories/in-memory-auth-session.repository.js';
import { JwtAuthGuard } from '#/modules/auth/shared/guards/jwt-auth.guard.js';
import { JwtTokenService } from '#/modules/auth/shared/tokens/jwt-token.service.js';
import type { RoleService } from '#/modules/role/role.service.js';
import { InMemoryUserRepository } from '#/modules/user/repositories/in-memory-user.repository.js';
import { UserService } from '#/modules/user/user.service.js';

/** 构造守卫测试上下文 */
function contextFor(authorization?: string): ExecutionContext {
  const request = { header: () => authorization };
  return {
    switchToHttp: () => ({ getRequest: () => request })
  } as unknown as ExecutionContext;
}

/** 构造认证服务 */
function createAdminAuthService(config: ConfigService): AdminAuthService {
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
function createUserService(): UserService {
  return new UserService(new InMemoryUserRepository(), { record: vi.fn() } as never);
}

describe('JwtAuthGuard', () => {
  it('rejects requests without a Bearer token', async () => {
    const config = new ConfigService({
      jwt: {
        secret: 'test-only-secret-with-at-least-32-chars',
        accessTokenExpiresIn: '15m',
        refreshTokenExpiresIn: '7d'
      }
    });
    const guard = new JwtAuthGuard(createAdminAuthService(config), new JwtTokenService(config), createUserService());
    await expect(guard.canActivate(contextFor())).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
