/// <reference types="vite/client" />
import 'reflect-metadata';
import { describe, expect, it } from 'vitest';
import { PERMISSION_KEY } from '#/modules/authorization/decorators/index.js';
import { REGISTERED_PERMISSIONS } from '#/modules/permission/constants/registered-permissions.constant.js';
import { flattenRegisteredMenus } from '#/modules/menu/utils/registered-menu.util.js';

const controllerModules = import.meta.glob<Record<string, unknown>>('/src/**/*.controller.ts', {
  eager: true
});

/** 读取全部控制器类。 */
function listControllers(): Function[] {
  return Object.values(controllerModules)
    .flatMap(controllerModule => Object.values(controllerModule))
    .filter(
      (exported): exported is Function =>
        typeof exported === 'function' && Reflect.getMetadata('path', exported) !== undefined
    );
}

/** 读取单个控制器类和其路由方法声明的权限编码。 */
function listRoutePermissionCodes(controller: Function): string[] {
  const codes: string[] = [];
  collectPermissionCode(codes, controller);
  for (const name of Object.getOwnPropertyNames(controller.prototype)) {
    if (name === 'constructor') {
      continue;
    }
    const handler = (controller.prototype as Record<string, unknown>)[name];
    if (typeof handler === 'function') {
      collectPermissionCode(codes, handler);
    }
  }
  return codes;
}

/** 收集目标上的权限编码元数据。 */
function collectPermissionCode(codes: string[], target: object): void {
  const code = Reflect.getMetadata(PERMISSION_KEY, target);
  if (typeof code === 'string') {
    codes.push(code);
  }
}

const controllers = listControllers();
const routeCodes = controllers.flatMap(listRoutePermissionCodes);
const menuCodes = flattenRegisteredMenus()
  .map(menu => menu.permissionCode)
  .filter((code): code is NonNullable<typeof code> => Boolean(code));
const usedCodes = [...routeCodes, ...menuCodes];

describe('路由和菜单权限编码与注册表一致性', () => {
  it('应扫描到控制器路由', () => {
    expect(controllers.length).toBeGreaterThan(0);
    expect(routeCodes.length).toBeGreaterThan(0);
  });

  it('路由声明的权限编码必须已注册', () => {
    const registeredCodes = REGISTERED_PERMISSIONS.map(permission => permission.code);

    for (const code of routeCodes) {
      expect(registeredCodes, `路由使用了未注册的权限编码 ${code}，该路由将永久拒绝访问`).toContain(code);
    }
  });

  it('注册的权限必须被至少一个路由或菜单使用', () => {
    for (const permission of REGISTERED_PERMISSIONS) {
      expect(usedCodes, `权限 ${permission.code} 未被路由或菜单使用`).toContain(permission.code);
    }
  });
});
