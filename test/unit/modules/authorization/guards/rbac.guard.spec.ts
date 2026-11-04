import { ForbiddenException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { RbacGuard } from '#/modules/authorization/guards/rbac.guard.js';

function contextFor(user?: { sub?: string; isRoot?: boolean }) {
  const handler = () => undefined;
  const controller = class TestController {};
  return {
    getHandler: () => handler,
    getClass: () => controller,
    switchToHttp: () => ({ getRequest: () => ({ user }) })
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
  it('allows public routes without authentication', async () => {
    const { guard } = createGuard({ publicRoute: true });
    await expect(guard.canActivate(contextFor())).resolves.toBe(true);
  });

  it('allows authenticated routes with a valid administrator', async () => {
    const { guard } = createGuard({ authenticatedRoute: true });
    await expect(guard.canActivate(contextFor({ sub: '1' }))).resolves.toBe(true);
  });

  it('rejects routes without authentication or authorization metadata', async () => {
    const { guard } = createGuard({});
    await expect(guard.canActivate(contextFor({ sub: '1' }))).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects non-root administrators on root-only routes', async () => {
    const { guard } = createGuard({ rootOnly: true });
    await expect(guard.canActivate(contextFor({ sub: '1' }))).rejects.toThrow('仅根管理员可执行');
  });

  it('allows root administrators on root-only routes without a dynamic permission', async () => {
    const { guard } = createGuard({ rootOnly: true });
    await expect(guard.canActivate(contextFor({ sub: '1', isRoot: true }))).resolves.toBe(true);
  });

  it('checks a dynamic permission by its business code', async () => {
    const { guard, authorizationService } = createGuard({ requiredPermission: 'booking.read' });
    await expect(guard.canActivate(contextFor({ sub: '1' }))).resolves.toBe(true);
    expect(authorizationService.hasPermission).toHaveBeenCalledWith('1', 'booking.read');
  });

  it('rejects an administrator without the required dynamic permission', async () => {
    const { guard } = createGuard({ requiredPermission: 'booking.read' }, false);
    await expect(guard.canActivate(contextFor({ sub: '1' }))).rejects.toThrow('无权访问');
  });

  it('rejects requests without an authenticated administrator', async () => {
    const { guard } = createGuard({ authenticatedRoute: true });
    await expect(guard.canActivate(contextFor())).rejects.toThrow('无权访问');
  });
});
