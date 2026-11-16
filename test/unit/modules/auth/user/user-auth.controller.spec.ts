import { describe, expect, it, vi } from 'vitest';
import { UserAuthController } from '#/modules/auth/user/user-auth.controller.js';

describe('UserAuthController', () => {
  it('应代理用户认证接口', async () => {
    const userAuthService = {
      login: vi.fn().mockResolvedValue({ accessToken: 'user-access' }),
      loginForDevelopment: vi.fn().mockResolvedValue({ accessToken: 'user-dev' }),
      refresh: vi.fn().mockResolvedValue({ accessToken: 'user-refresh' }),
      logout: vi.fn().mockResolvedValue(null)
    };
    const controller = new UserAuthController(userAuthService as never);

    await controller.wechatLogin({ code: 'code' });
    await controller.developmentLogin({ nickname: 'H5开发用户' });
    await controller.refresh({ refreshToken: 'user-refresh-token' });
    await controller.logout({ refreshToken: 'user-refresh-token' });

    expect(userAuthService.login).toHaveBeenCalledWith('code', undefined, undefined);
    expect(userAuthService.loginForDevelopment).toHaveBeenCalledWith('H5开发用户');
    expect(userAuthService.refresh).toHaveBeenCalledWith('user-refresh-token');
    expect(userAuthService.logout).toHaveBeenCalledWith('user-refresh-token');
  });
});
