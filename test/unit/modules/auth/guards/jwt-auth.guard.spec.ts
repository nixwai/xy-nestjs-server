import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { describe, expect, it } from 'vitest';
import { AdminService } from '../../../../../src/modules/admin/admin.service.js';
import { InMemoryAdminRepository } from '../../../../../src/modules/admin/repositories/in-memory-admin.repository.js';
import { InMemoryAdminTransactionRunner } from '../../../../../src/modules/admin/repositories/admin-transaction-runner.js';
import { AuditService } from '../../../../../src/modules/audit/audit.service.js';
import { AuthService } from '../../../../../src/modules/auth/auth.service.js';
import { InMemoryAuthSessionRepository } from '../../../../../src/modules/auth/repositories/in-memory-auth-session.repository.js';
import { JwtAuthGuard } from '../../../../../src/modules/auth/guards/jwt-auth.guard.js';
import { JwtTokenService } from '../../../../../src/modules/auth/tokens/jwt-token.service.js';
import { RoleService } from '../../../../../src/modules/role/role.service.js';

function contextFor(authorization?: string): ExecutionContext {
  const request = { header: () => authorization };
  return {
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
}

function createAuthService(config: ConfigService): AuthService {
  const repository = new InMemoryAdminRepository();
  const adminService = new AdminService(
    repository,
    {
      findByCode: async () => null,
      findById: async () => null,
    } as unknown as RoleService,
    new AuditService(),
    new InMemoryAdminTransactionRunner(repository),
  );
  return new AuthService(
    adminService,
    new InMemoryAuthSessionRepository(),
    config,
    new JwtTokenService(config),
  );
}

describe('JwtAuthGuard', () => {
  it('rejects requests without a Bearer token', async () => {
    const config = new ConfigService({
      jwt: {
        secret: 'test-only-secret-with-at-least-32-chars',
        accessTokenExpiresIn: '15m',
        refreshTokenExpiresIn: '7d',
      },
    });
    const guard = new JwtAuthGuard(
      createAuthService(config),
      new JwtTokenService(config),
    );
    await expect(guard.canActivate(contextFor())).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});
