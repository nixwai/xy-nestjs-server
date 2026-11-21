import { ForbiddenException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { RbacGuard } from '#/modules/authorization/guards/rbac.guard.js';

type TestUser = {
  /** 当前用户标识。 */
  sub?: string;
  /** 身份类型。 */
  role?: 'admin' | 'user';
  /** 是否为根管理员。 */
  isRoot?: boolean;
};

/** 构造守卫测试上下文 */
function contextFor(user?: TestUser) {
  /** handler。 */
  const handler = () => undefined;
  const controller = class TestController {};
  return {
    getHandler: () => handler,
    getClass: () => controller,
    switchToHttp: () => ({ getRequest: () => ({ user }) })
  } as never;
}

/** 构造createGuard。 */
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
  it('allows public routes without authentication', async () => {
    const { guard } = createGuard({ publicRoute: true });
    await expect(guard.canActivate(contextFor())).resolves.toBe(true);
  });

  it('allows authenticated routes with a valid administrator', async () => {
    const { guard } = createGuard({ authenticatedRoute: true });
    await expect(guard.canActivate(contextFor({ sub: '1', role: 'admin' }))).resolves.toBe(true);
  });

  it('allows authenticated routes with a valid user', async () => {
    const { guard } = createGuard({ authenticatedRoute: true });
    await expect(guard.canActivate(contextFor({ sub: '1', role: 'user' }))).resolves.toBe(true);
  });

  it('rejects routes without authentication or authorization metadata', async () => {
    const { guard } = createGuard({});
    await expect(guard.canActivate(contextFor({ sub: '1', role: 'admin' }))).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects non-root administrators on root-only routes', async () => {
    const { guard } = createGuard({ rootOnly: true });
    await expect(guard.canActivate(contextFor({ sub: '1', role: 'admin' }))).rejects.toThrow('仅根管理员可执行');
  });

  it('rejects users on root-only routes', async () => {
    const { guard } = createGuard({ rootOnly: true });
    await expect(guard.canActivate(contextFor({ sub: '1', role: 'user', isRoot: true }))).rejects.toThrow('无权访问');
  });

  it('allows root administrators on root-only routes without a dynamic permission', async () => {
    const { guard } = createGuard({ rootOnly: true });
    await expect(guard.canActivate(contextFor({ sub: '1', role: 'admin', isRoot: true }))).resolves.toBe(true);
  });

  it('checks a dynamic permission by its business code', async () => {
    const { guard, authorizationService } = createGuard({ requiredPermission: 'resource.read' });
    await expect(guard.canActivate(contextFor({ sub: '1', role: 'admin' }))).resolves.toBe(true);
    expect(authorizationService.hasPermission).toHaveBeenCalledWith('1', 'resource.read');
  });

  it('rejects users on dynamic permission routes', async () => {
    const { guard, authorizationService } = createGuard({ requiredPermission: 'resource.read' });
    await expect(guard.canActivate(contextFor({ sub: '1', role: 'user' }))).rejects.toThrow('无权访问');
    expect(authorizationService.hasPermission).not.toHaveBeenCalled();
  });

  it('rejects an administrator without the required dynamic permission', async () => {
    const { guard } = createGuard({ requiredPermission: 'resource.read' }, false);
    await expect(guard.canActivate(contextFor({ sub: '1', role: 'admin' }))).rejects.toThrow('无权访问');
  });

  it('rejects users on AdminOnly routes', async () => {
    const { guard } = createGuard({ adminRole: true });
    await expect(guard.canActivate(contextFor({ sub: '1', role: 'user' }))).rejects.toThrow('无权访问');
  });

  it('rejects administrators on UserOnly routes', async () => {
    const { guard } = createGuard({ userRole: true });
    await expect(guard.canActivate(contextFor({ sub: '1', role: 'admin' }))).rejects.toThrow('无权访问');
  });

  it('allows users on UserOnly routes', async () => {
    const { guard } = createGuard({ userRole: true });
    await expect(guard.canActivate(contextFor({ sub: '1', role: 'user' }))).resolves.toBe(true);
  });
  it('rejects requests without an authenticated administrator', async () => {
    const { guard } = createGuard({ authenticatedRoute: true });
    await expect(guard.canActivate(contextFor())).rejects.toThrow('无权访问');
  });
});
