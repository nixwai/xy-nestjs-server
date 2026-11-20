import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { HttpCode } from '#/common/enums/index.js';
import { ConfigService } from '@nestjs/config';
import { describe, expect, it, vi } from 'vitest';
import { UserAuthService } from '#/modules/auth/user/user-auth.service.js';
import { JwtTokenService } from '#/modules/auth/shared/tokens/jwt-token.service.js';
import { InMemoryUserAuthSessionRepository } from '#/modules/auth/user/repositories/in-memory-user-auth-session.repository.js';
import { InMemoryUserRepository } from '#/modules/user/repositories/in-memory-user.repository.js';
import { UserService } from '#/modules/user/user.service.js';
import type { WechatLoginProvider } from '#/modules/auth/user/providers/wechat-login.provider.js';

function createConfig(environment: 'development' | 'test' = 'development'): ConfigService {
  return new ConfigService({
    app: { environment },
    jwt: {
      secret: 'test-only-secret-with-at-least-32-chars',
      accessTokenExpiresIn: '15m',
      refreshTokenExpiresIn: '7d'
    }
  });
}

function createService(provider: WechatLoginProvider, environment: 'development' | 'test' = 'development') {
  const repository = new InMemoryUserRepository();
  const userService = new UserService(repository, { record: vi.fn() } as never);
  const serviceConfig = createConfig(environment);
  const tokenService = new JwtTokenService(serviceConfig);
  const service = new UserAuthService(
    userService,
    new InMemoryUserAuthSessionRepository(),
    serviceConfig,
    tokenService,
    provider
  );
  return { service, repository, tokenService };
}

describe('UserAuthService', () => {
  it('开发环境可创建不绑定微信身份的用户并返回令牌', async () => {
    const { service, repository, tokenService } = createService({
      exchangeCode: vi.fn()
    });

    const result = await service.loginForDevelopment('H5开发用户');

    expect(result.user).toMatchObject({ id: '1', nickname: 'H5开发用户', role: 'user' });
    await expect(repository.findById('1')).resolves.toMatchObject({
      openId: null,
      unionId: null,
      nickname: 'H5开发用户'
    });
    expect(tokenService.verifyAccessToken(result.accessToken)).toMatchObject({ sub: '1', role: 'user' });
  });

  it('非开发环境拒绝开发登录', async () => {
    const { service, repository } = createService({ exchangeCode: vi.fn() }, 'test');

    await expect(service.loginForDevelopment()).rejects.toBeInstanceOf(NotFoundException);
    await expect(repository.list({ page: 1, pageSize: 20, skip: 0 })).resolves.toMatchObject({ total: 0 });
  });

  it('使用微信登录凭证创建用户并返回用户令牌', async () => {
    const { service, repository, tokenService } = createService({
      exchangeCode: vi.fn().mockResolvedValue({ openId: 'openid-1', unionId: 'unionid-1' })
    });

    const result = await service.login('valid-code', '微信用户', 'https://example.com/avatar.png');

    expect(result.user).toMatchObject({ id: '1', nickname: '微信用户', role: 'user' });
    expect(result.accessToken).toBeTruthy();
    expect(tokenService.verifyAccessToken(result.accessToken)).toMatchObject({ sub: '1', role: 'user' });
    await expect(repository.findByOpenId('openid-1')).resolves.toMatchObject({ nickname: '微信用户' });
  });

  it('停用用户不得使用微信登录', async () => {
    const { service, repository } = createService({
      exchangeCode: vi.fn().mockResolvedValue({ openId: 'openid-disabled' })
    });
    const user = await repository.upsertByWechatIdentity({ openId: 'openid-disabled', nickname: '已停用' });
    await repository.update(user.id, { isActive: false });

    await expect(service.login('valid-code')).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('刷新令牌失效时返回独立业务码', async () => {
    const { service } = createService({ exchangeCode: vi.fn() });

    await expect(service.refresh('missing-refresh-token')).rejects.toMatchObject({
      response: { code: HttpCode.REFRESH_TOKEN_INVALID, message: '刷新令牌无效' }
    });
  });
});
