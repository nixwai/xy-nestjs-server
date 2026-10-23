import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { describe, expect, it } from 'vitest';
import { ApiVersionGuard } from './api-version.guard.js';

function contextFor(path: string, accept?: string): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ path, header: () => accept }),
    }),
    getHandler: () => () => undefined,
    getClass: () => class TestController {},
  } as unknown as ExecutionContext;
}

describe('ApiVersionGuard', () => {
  it('allows health checks without a version header', () => {
    const guard = new ApiVersionGuard(new Reflector());
    expect(guard.canActivate(contextFor('/api/health'))).toBe(true);
  });

  it('rejects unsupported business API versions', () => {
    const guard = new ApiVersionGuard(new Reflector());
    expect(() => guard.canActivate(contextFor('/api/site'))).toThrow(
      '必须使用 Accept',
    );
  });

  it('allows the supported business API version', () => {
    const guard = new ApiVersionGuard(new Reflector());
    expect(
      guard.canActivate(
        contextFor('/api/site', 'application/vnd.scenic.v1+json'),
      ),
    ).toBe(true);
  });
});
