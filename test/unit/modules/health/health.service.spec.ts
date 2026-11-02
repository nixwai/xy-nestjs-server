import type { ConfigService } from '@nestjs/config';
import { describe, expect, it } from 'vitest';
import { HealthService } from '../../../../src/modules/health/health.service.js';

describe('HealthService', () => {
  it('reports liveness and readiness when database is disabled', async () => {
    const config = {
      get: <T>(_key: string, fallback: T): T => fallback
    } as unknown as ConfigService;
    const service = new HealthService(config);

    expect(service.getHealth()).toMatchObject({ status: 'ok' });
    await expect(service.getReadiness()).resolves.toMatchObject({
      status: 'ready',
      checks: { database: 'up' }
    });
  });
});
