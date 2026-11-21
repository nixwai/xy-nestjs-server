import { ROUTE_ARGS_METADATA } from '@nestjs/common/constants';
import { describe, expect, it } from 'vitest';
import { CurrentAdmin } from '#/modules/auth/admin/decorators/current-admin.decorator.js';

describe('CurrentAdmin', () => {
  it('returns the authenticated administrator from the request', () => {
    class TestController {}
    const handler = 'handle';
    const payload = { sub: 'admin-1', role: 'admin', type: 'access', iat: 1, exp: 2, isRoot: true };
    CurrentAdmin()(TestController.prototype, handler, 0);

    const metadata = Reflect.getMetadata(ROUTE_ARGS_METADATA, TestController, handler) as Record<
      string,
      { factory: (data: unknown, context: unknown) => unknown }
    >;
    const factory = Object.values(metadata)[0].factory;
    const context = { switchToHttp: () => ({ getRequest: () => ({ user: payload }) }) };

    expect(factory(undefined, context)).toEqual(payload);
  });
});
