import { Reflector } from '@nestjs/core';
import { describe, expect, it } from 'vitest';
import {
  AUTHENTICATED_ROUTE_KEY,
  PERMISSION_KEY,
  PUBLIC_ROUTE_KEY,
  RequirePermission,
  Public,
  RootOnly,
  ROOT_ONLY_KEY,
  Authenticated
} from '#/modules/authorization/decorators/index.js';
import { PermissionCode } from '#/modules/authorization/constants/index.js';

class TestController {}
const publicRoute = (): void => undefined;
const authenticatedRoute = (): void => undefined;
const protectedRoute = (): void => undefined;
Object.defineProperty(TestController.prototype, 'publicRoute', { value: publicRoute });
Object.defineProperty(TestController.prototype, 'authenticatedRoute', { value: authenticatedRoute });
Object.defineProperty(TestController.prototype, 'protectedRoute', { value: protectedRoute });
Public()(TestController.prototype, 'publicRoute', { value: publicRoute });
Authenticated()(TestController.prototype, 'authenticatedRoute', { value: authenticatedRoute });
RequirePermission(PermissionCode.AUDIT_READ)(TestController.prototype, 'protectedRoute', { value: protectedRoute });
RootOnly()(TestController);

describe('authorization decorators', () => {
  it('stores public, authenticated and permission metadata', () => {
    const reflector = new Reflector();
    expect(reflector.get(PUBLIC_ROUTE_KEY, publicRoute)).toBe(true);
    expect(reflector.get(AUTHENTICATED_ROUTE_KEY, authenticatedRoute)).toBe(true);
    expect(reflector.get(PERMISSION_KEY, protectedRoute)).toBe(PermissionCode.AUDIT_READ);
  });

  it('stores the root administrator constraint on the controller', () => {
    const reflector = new Reflector();
    expect(reflector.get(ROOT_ONLY_KEY, TestController)).toBe(true);
  });
});
