import { ConfigService } from '@nestjs/config';
import { describe, expect, it, vi } from 'vitest';
import { RateLimitGuard } from '../../../../src/common/guards/rate-limit.guard.js';

/** 创建携带客户端 IP 的限流守卫测试上下文桩。 */
function contextFor(ip: string) {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ ip }),
    }),
  } as never;
}

describe('RateLimitGuard', () => {
  it('removes expired entries during periodic cleanup', () => {
    vi.useFakeTimers();
    const configService = {
      get: <T>(_key: string, fallback: T): T => fallback,
    } as unknown as ConfigService;
    const guard = new RateLimitGuard(configService);

    guard.canActivate(contextFor('192.0.2.1'));
    guard.canActivate(contextFor('192.0.2.2'));
    expect(
      (guard as unknown as { entries: Map<string, unknown> }).entries.size,
    ).toBe(2);

    vi.advanceTimersByTime(60_001);
    guard.canActivate(contextFor('192.0.2.3'));

    expect(
      (guard as unknown as { entries: Map<string, unknown> }).entries.size,
    ).toBe(1);
    vi.useRealTimers();
  });
});
