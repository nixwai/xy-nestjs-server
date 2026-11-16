import { Reflector } from '@nestjs/core';
import { describe, expect, it } from 'vitest';
import {
  ADMIN_ROLE_KEY,
  AdminOnly,
  AUTHENTICATED_ROUTE_KEY,
  PERMISSION_KEY,
  PUBLIC_ROUTE_KEY,
  RequirePermission,
  Public,
  RootOnly,
  ROOT_ONLY_KEY,
  Authenticated,
  USER_ROLE_KEY,
  UserOnly
} from '#/modules/authorization/decorators/index.js';
import { PermissionCode } from '#/modules/authorization/constants/index.js';
/** 定义 TestController。 */
class TestController {}
/** publicRoute。 */
const publicRoute = (): void => undefined;
/** authenticatedRoute。 */
const authenticatedRoute = (): void => undefined;
/** protectedRoute。 */
const protectedRoute = (): void => undefined;
/** adminOnlyRoute。 */
const adminOnlyRoute = (): void => undefined;
/** userOnlyRoute。 */
const userOnlyRoute = (): void => undefined;
Object.defineProperty(TestController.prototype, 'publicRoute', { value: publicRoute });
Object.defineProperty(TestController.prototype, 'authenticatedRoute', { value: authenticatedRoute });
Object.defineProperty(TestController.prototype, 'protectedRoute', { value: protectedRoute });
Object.defineProperty(TestController.prototype, 'adminOnlyRoute', { value: adminOnlyRoute });
Object.defineProperty(TestController.prototype, 'userOnlyRoute', { value: userOnlyRoute });
Public()(TestController.prototype, 'publicRoute', { value: publicRoute });
Authenticated()(TestController.prototype, 'authenticatedRoute', { value: authenticatedRoute });
RequirePermission(PermissionCode.AUDIT_READ)(TestController.prototype, 'protectedRoute', { value: protectedRoute });
AdminOnly()(TestController.prototype, 'adminOnlyRoute', { value: adminOnlyRoute });
UserOnly()(TestController.prototype, 'userOnlyRoute', { value: userOnlyRoute });
RootOnly()(TestController);

describe('authorization decorators', () => {
  it('stores public, authenticated and permission metadata', () => {
    const reflector = new Reflector();
    expect(reflector.get(PUBLIC_ROUTE_KEY, publicRoute)).toBe(true);
    expect(reflector.get(AUTHENTICATED_ROUTE_KEY, authenticatedRoute)).toBe(true);
    expect(reflector.get(PERMISSION_KEY, protectedRoute)).toBe(PermissionCode.AUDIT_READ);
  });

  it('stores administrator and user role metadata', () => {
    const reflector = new Reflector();
    expect(reflector.get(ADMIN_ROLE_KEY, adminOnlyRoute)).toBe(true);
    expect(reflector.get(USER_ROLE_KEY, userOnlyRoute)).toBe(true);
  });

  it('stores the root administrator constraint on the controller', () => {
    const reflector = new Reflector();
    expect(reflector.get(ROOT_ONLY_KEY, TestController)).toBe(true);
  });
});
