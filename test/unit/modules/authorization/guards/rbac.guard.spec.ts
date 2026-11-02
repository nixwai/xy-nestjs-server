import { ForbiddenException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { HttpMethod, PermissionResource } from '../../../../../src/modules/authorization/enums/index.js';
import { RbacGuard } from '../../../../../src/modules/authorization/guards/rbac.guard.js';

function contextFor(user?: { sub?: string; isSuperAdmin?: boolean }, method = 'GET') {
  const handler = () => undefined;
  const controller = class TestController {};
  return {
    getHandler: () => handler,
    getClass: () => controller,
    switchToHttp: () => ({ getRequest: () => ({ user, method }) })
  } as never;
}

function createGuard(metadata: Record<string, unknown>, hasPermission = true) {
  const reflector = {
    getAllAndOverride: vi.fn((key: string) => metadata[key])
  };
  const authorizationService = {
    hasPermission: vi.fn().mockResolvedValue(hasPermission)
  };
  return {
    guard: new RbacGuard(reflector as never, authorizationService as never),
    authorizationService
  };
}

describe('RbacGuard', () => {
  it('allows public routes without permission metadata', async () => {
    const { guard } = createGuard({ publicRoute: true });
    await expect(guard.canActivate(contextFor())).resolves.toBe(true);
  });

  it('rejects routes without permission metadata', async () => {
    const { guard } = createGuard({});
    await expect(guard.canActivate(contextFor({ sub: '1' }))).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects non-super administrators on super administrator routes', async () => {
    const { guard } = createGuard({
      requiredPermission: {
        resource: PermissionResource.ADMIN
      },
      superAdminOnly: true
    });
    await expect(guard.canActivate(contextFor({ sub: '1' }))).rejects.toThrow('仅超级管理员可执行');
  });

  it('allows super administrators on super administrator routes', async () => {
    const { guard } = createGuard({
      requiredPermission: {
        resource: PermissionResource.ADMIN
      },
      superAdminOnly: true
    });
    await expect(guard.canActivate(contextFor({ sub: '1', isSuperAdmin: true }))).resolves.toBe(true);
  });

  it('allows the current administrator route after authentication', async () => {
    const { guard, authorizationService } = createGuard({
      requiredPermission: {
        resource: PermissionResource.ADMIN_SELF
      }
    });
    await expect(guard.canActivate(contextFor({ sub: '1' }))).resolves.toBe(true);
    expect(authorizationService.hasPermission).not.toHaveBeenCalled();
  });

  it('matches the request method when checking a permission', async () => {
    const { guard, authorizationService } = createGuard({
      requiredPermission: {
        resource: PermissionResource.ADMIN
      }
    });
    await expect(guard.canActivate(contextFor({ sub: '1' }, 'post'))).resolves.toBe(true);
    expect(authorizationService.hasPermission).toHaveBeenCalledWith('1', PermissionResource.ADMIN, HttpMethod.POST);
  });

  it('rejects an administrator without the required permission', async () => {
    const { guard } = createGuard(
      {
        requiredPermission: {
          resource: PermissionResource.ADMIN
        }
      },
      false
    );
    await expect(guard.canActivate(contextFor({ sub: '1' }))).rejects.toThrow('无权访问');
  });

  it('rejects unsupported request methods', async () => {
    const { guard } = createGuard({
      requiredPermission: {
        resource: PermissionResource.ADMIN
      }
    });
    await expect(guard.canActivate(contextFor({ sub: '1' }, 'PATCH'))).rejects.toThrow('不支持的请求方法');
  });

  it('rejects requests without an authenticated administrator', async () => {
    const { guard } = createGuard({
      requiredPermission: {
        resource: PermissionResource.ADMIN
      }
    });
    await expect(guard.canActivate(contextFor())).rejects.toThrow('无权访问');
  });
});
