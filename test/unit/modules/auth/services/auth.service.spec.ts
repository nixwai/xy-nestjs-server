import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { beforeEach, describe, expect, it } from 'vitest';
import { AdminService } from '../../../../../src/modules/admin/admin.service.js';
import { InMemoryAdminRepository } from '../../../../../src/modules/admin/repositories/in-memory-admin.repository.js';
import { InMemoryAdminTransactionRunner } from '../../../../../src/modules/admin/repositories/admin-transaction-runner.js';
import { AuditService } from '../../../../../src/modules/audit/audit.service.js';
import { AuthService } from '../../../../../src/modules/auth/auth.service.js';
import { InMemoryAuthSessionRepository } from '../../../../../src/modules/auth/repositories/in-memory-auth-session.repository.js';
import { JwtTokenService } from '../../../../../src/modules/auth/tokens/jwt-token.service.js';
import { RoleService } from '../../../../../src/modules/role/role.service.js';

function createConfig(): ConfigService {
  return new ConfigService({
    jwt: {
      secret: 'test-only-secret-with-at-least-32-chars',
      accessTokenExpiresIn: '15m',
      refreshTokenExpiresIn: '7d',
    },
  });
}

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const config = createConfig();
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
    service = new AuthService(
      adminService,
      new InMemoryAuthSessionRepository(),
      config,
      new JwtTokenService(config),
    );
    await service.createInitialAdmin('admin', 'Admin1234');
  });

  it('logs in and returns public admin identity with tokens', async () => {
    const result = await service.login('admin', 'Admin1234');
    expect(result).toMatchObject({
      tokenType: 'Bearer',
      admin: { id: '1', username: 'admin', role: 'admin' },
    });
    expect(result.accessToken).toBeTruthy();
    expect(result.refreshToken).toBeTruthy();
    expect(result).not.toHaveProperty('passwordHash');
  });

  it('rejects invalid credentials with the same public error', async () => {
    await expect(service.login('missing', 'Admin1234')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    await expect(service.login('admin', 'Wrong1234')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('rotates refresh tokens and rejects replay of the old token', async () => {
    const first = await service.login('admin', 'Admin1234');
    const second = await service.refresh(first.refreshToken);
    expect(second.refreshToken).not.toBe(first.refreshToken);

    await expect(service.refresh(first.refreshToken)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    await expect(service.refresh(second.refreshToken)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('revokes a refresh session on logout', async () => {
    const result = await service.login('admin', 'Admin1234');
    await expect(service.logout(result.refreshToken)).resolves.toBeNull();
    await expect(service.refresh(result.refreshToken)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});
