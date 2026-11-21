import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { beforeEach, describe, expect, it } from 'vitest';
import { AdminService } from '#/modules/admin/admin.service.js';
import { HttpCode } from '#/common/enums/index.js';
import { InMemoryAdminRepository } from '#/modules/admin/repositories/in-memory-admin.repository.js';
import { InMemoryAdminTransactionRunner } from '#/modules/admin/repositories/in-memory-admin-transaction-runner.js';
import { AuditService } from '#/modules/audit/audit.service.js';
import { AdminAuthService } from '#/modules/auth/admin/admin-auth.service.js';
import { InMemoryAuthSessionRepository } from '#/modules/auth/admin/repositories/in-memory-auth-session.repository.js';
import { JwtTokenService } from '#/modules/auth/shared/tokens/jwt-token.service.js';
import type { RoleService } from '#/modules/role/role.service.js';
/** 构造createConfig。 */
function createConfig(): ConfigService {
  return new ConfigService({
    jwt: {
      secret: 'test-only-secret-with-at-least-32-chars',
      accessTokenExpiresIn: '15m',
      refreshTokenExpiresIn: '7d'
    }
  });
}

describe('AdminAuthService', () => {
  let service: AdminAuthService;

  beforeEach(async () => {
    const config = createConfig();
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
    service = new AdminAuthService(
      adminService,
      new InMemoryAuthSessionRepository(),
      config,
      new JwtTokenService(config)
    );
    await service.createInitialAdmin('admin', 'Admin1234');
  });

  it('logs in and returns public admin identity with tokens', async () => {
    const result = await service.login('admin', 'Admin1234');
    expect(result).toMatchObject({
      tokenType: 'Bearer',
      admin: { id: '1', username: 'admin', role: 'admin' }
    });
    expect(result.accessToken).toBeTruthy();
    expect(result.refreshToken).toBeTruthy();
    expect(result).not.toHaveProperty('passwordHash');
  });

  it('rejects invalid credentials with the same public error', async () => {
    await expect(service.login('missing', 'Admin1234')).rejects.toBeInstanceOf(UnauthorizedException);
    await expect(service.login('admin', 'Wrong1234')).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rotates refresh tokens and rejects replay of the old token', async () => {
    const first = await service.login('admin', 'Admin1234');
    const second = await service.refresh(first.refreshToken);
    expect(second.refreshToken).not.toBe(first.refreshToken);

    await expect(service.refresh(first.refreshToken)).rejects.toMatchObject({
      response: { code: HttpCode.REFRESH_TOKEN_INVALID, message: '刷新令牌无效' }
    });
    await expect(service.refresh(second.refreshToken)).rejects.toMatchObject({
      response: { code: HttpCode.REFRESH_TOKEN_INVALID, message: '刷新令牌无效' }
    });
  });

  it('revokes the whole session family without affecting another login', async () => {
    const first = await service.login('admin', 'Admin1234');
    const otherLogin = await service.login('admin', 'Admin1234');
    const rotated = await service.refresh(first.refreshToken);

    await expect(service.refresh(first.refreshToken)).rejects.toMatchObject({
      response: { code: HttpCode.REFRESH_TOKEN_INVALID, message: '刷新令牌无效' }
    });
    await expect(service.refresh(rotated.refreshToken)).rejects.toMatchObject({
      response: { code: HttpCode.REFRESH_TOKEN_INVALID, message: '刷新令牌无效' }
    });
    await expect(service.refresh(otherLogin.refreshToken)).resolves.toMatchObject({
      admin: { id: '1' }
    });
  });

  it('revokes a refresh session on logout', async () => {
    const result = await service.login('admin', 'Admin1234');
    await expect(service.logout(result.refreshToken)).resolves.toBeNull();
    await expect(service.refresh(result.refreshToken)).rejects.toMatchObject({
      response: { code: HttpCode.REFRESH_TOKEN_INVALID, message: '刷新令牌无效' }
    });
  });
});
