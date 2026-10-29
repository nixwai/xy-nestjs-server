import { describe, expect, it, vi } from 'vitest';
import { HealthController } from '../../../../src/modules/health/health.controller.js';

describe('HealthController', () => {
  it('应返回存活和就绪状态', async () => {
    const service = {
      getHealth: vi.fn().mockReturnValue({ status: 'ok' }),
      getReadiness: vi.fn().mockResolvedValue({ status: 'ready' }),
    };
    const controller = new HealthController(service as never);

    expect(controller.getHealth()).toEqual({ status: 'ok' });
    await expect(controller.getReadiness()).resolves.toEqual({
      status: 'ready',
    });
  });
});
