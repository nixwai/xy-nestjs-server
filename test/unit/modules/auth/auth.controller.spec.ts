import { describe, expect, it, vi } from 'vitest';
import { AuthController } from '../../../../src/modules/auth/auth.controller.js';

describe('AuthController', () => {
  it('应代理认证接口', async () => {
    const service = {
      login: vi.fn().mockResolvedValue({ accessToken: 'a' }),
      refresh: vi.fn().mockResolvedValue({ accessToken: 'b' }),
      logout: vi.fn().mockResolvedValue(null)
    };
    const passwordTransport = {
      getPublicKey: vi.fn().mockReturnValue('public-key'),
      decryptPassword: vi.fn().mockReturnValue('Admin1234')
    };
    const controller = new AuthController(service as never, passwordTransport as never);

    await controller.publicKey();
    await controller.login({ username: 'admin', password: 'ciphertext' });
    await controller.refresh({ refreshToken: 'refresh' });
    await controller.logout({ refreshToken: 'refresh' });

    expect(passwordTransport.getPublicKey).toHaveBeenCalled();
    expect(passwordTransport.decryptPassword).toHaveBeenCalledWith('ciphertext');
    expect(service.login).toHaveBeenCalledWith('admin', 'Admin1234');
    expect(service.refresh).toHaveBeenCalledWith('refresh');
    expect(service.logout).toHaveBeenCalledWith('refresh');
  });
});
