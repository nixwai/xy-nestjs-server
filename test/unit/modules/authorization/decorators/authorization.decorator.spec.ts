import { Reflector } from '@nestjs/core';
import { describe, expect, it } from 'vitest';
import {
  PERMISSION_KEY,
  PUBLIC_ROUTE_KEY,
  RequirePermission,
  Public,
  SUPER_ADMIN_ONLY_KEY,
  SuperAdminOnly,
} from '../../../../../src/modules/authorization/decorators/index.js';
import { PermissionResource } from '../../../../../src/modules/authorization/enums/index.js';

class TestController {}

const publicRoute = (): void => undefined;
const protectedRoute = (): void => undefined;
Object.defineProperty(TestController.prototype, 'publicRoute', {
  configurable: true,
  enumerable: false,
  value: publicRoute,
  writable: true,
});
Object.defineProperty(TestController.prototype, 'protectedRoute', {
  configurable: true,
  enumerable: false,
  value: protectedRoute,
  writable: true,
});
Public()(TestController.prototype, 'publicRoute', {
  configurable: true,
  enumerable: false,
  value: publicRoute,
  writable: true,
});
RequirePermission(PermissionResource.ADMIN)(
  TestController.prototype,
  'protectedRoute',
  {
    configurable: true,
    enumerable: false,
    value: protectedRoute,
    writable: true,
  },
);
SuperAdminOnly()(TestController);

describe('authorization decorators', () => {
  it('stores public route and permission metadata', () => {
    const reflector = new Reflector();
    expect(reflector.get(PUBLIC_ROUTE_KEY, publicRoute)).toBe(true);
    expect(reflector.get(PERMISSION_KEY, protectedRoute)).toEqual({
      resource: PermissionResource.ADMIN,
    });
  });

  it('stores the super administrator constraint on the controller', () => {
    const reflector = new Reflector();
    expect(reflector.get(SUPER_ADMIN_ONLY_KEY, TestController)).toBe(true);
  });
});
