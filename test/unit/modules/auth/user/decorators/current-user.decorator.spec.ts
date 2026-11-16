import { ROUTE_ARGS_METADATA } from '@nestjs/common/constants';
import { describe, expect, it } from 'vitest';
import { CurrentUser } from '#/modules/auth/user/decorators/current-user.decorator.js';

describe('CurrentUser', () => {
  it('returns the authenticated user from the request', () => {
    class TestController {}
    const handler = 'handle';
    const payload = { sub: 'user-1', role: 'user', type: 'access', iat: 1, exp: 2 };
    CurrentUser()(TestController.prototype, handler, 0);

    const metadata = Reflect.getMetadata(ROUTE_ARGS_METADATA, TestController, handler) as Record<
      string,
      { factory: (data: unknown, context: unknown) => unknown }
    >;
    const factory = Object.values(metadata)[0].factory;
    const context = { switchToHttp: () => ({ getRequest: () => ({ user: payload }) }) };

    expect(factory(undefined, context)).toEqual(payload);
  });
});
