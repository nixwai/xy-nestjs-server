import { describe, expect, it, vi } from 'vitest';
import { AdminAuthController } from '#/modules/auth/admin/admin-auth.controller.js';

describe('AdminAuthController', () => {
  it('应代理管理员认证接口', async () => {
    const adminAuthService = {
      login: vi.fn().mockResolvedValue({ accessToken: 'admin-access' }),
      refresh: vi.fn().mockResolvedValue({ accessToken: 'admin-refresh' }),
      logout: vi.fn().mockResolvedValue(null)
    };
    const passwordTransport = {
      getPublicKey: vi.fn().mockReturnValue('public-key'),
      decryptPassword: vi.fn().mockReturnValue('Admin1234')
    };
    const controller = new AdminAuthController(adminAuthService as never, passwordTransport as never);

    await controller.publicKey();
    await controller.login({ username: 'admin', password: 'ciphertext' });
    await controller.refresh({ refreshToken: 'admin-refresh-token' });
    await controller.logout({ refreshToken: 'admin-refresh-token' });

    expect(passwordTransport.getPublicKey).toHaveBeenCalledOnce();
    expect(passwordTransport.decryptPassword).toHaveBeenCalledWith('ciphertext');
    expect(adminAuthService.login).toHaveBeenCalledWith('admin', 'Admin1234');
    expect(adminAuthService.refresh).toHaveBeenCalledWith('admin-refresh-token');
    expect(adminAuthService.logout).toHaveBeenCalledWith('admin-refresh-token');
  });
});
