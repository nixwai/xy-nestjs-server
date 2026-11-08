import { describe, expect, it } from 'vitest';
import { PermissionCode } from '#/modules/authorization/constants/index.js';
import {
  getPermissionCategoryName,
  getPermissionCategoryOrder
} from '#/modules/permission/utils/permission-category.util.js';
import {
  REGISTERED_PERMISSIONS,
  REGISTERED_PERMISSION_GROUPS
} from '#/modules/permission/constants/registered-permissions.constant.js';

const permissionCodePattern = /^[a-z][a-z0-9]*(?:\.[a-z][a-z0-9-]*)+$/;
const declaredCodes = Object.values(PermissionCode);

describe('REGISTERED_PERMISSION_GROUPS', () => {
  it('分组分类必须唯一且具备展示名称', () => {
    const categories = REGISTERED_PERMISSION_GROUPS.map(group => group.category);

    expect(new Set(categories).size).toBe(categories.length);
    for (const group of REGISTERED_PERMISSION_GROUPS) {
      expect(group.name).not.toBe('');
      expect(group.name).not.toBe(group.category);
    }
  });

  it('权限编码首段必须与所在分组的分类一致', () => {
    for (const group of REGISTERED_PERMISSION_GROUPS) {
      for (const permission of group.permissions) {
        expect(permission.code.split('.')[0]).toBe(group.category);
      }
    }
  });

  it('受保护权限不得同时标记为可分配', () => {
    for (const permission of REGISTERED_PERMISSIONS) {
      if (permission.isProtected) {
        expect(permission.isAssignable).toBe(false);
      }
    }
  });
});

describe('REGISTERED_PERMISSIONS', () => {
  it('uses stable business permission codes and explicit assignment boundaries', () => {
    for (const permission of REGISTERED_PERMISSIONS) {
      expect(permission.code).toMatch(permissionCodePattern);
      expect(permission.category).toBeTruthy();
      expect(typeof permission.isAssignable).toBe('boolean');
      expect(typeof permission.isProtected).toBe('boolean');
    }
  });

  it('铺平结果应保留分组分类且不遗漏权限', () => {
    const total = REGISTERED_PERMISSION_GROUPS.reduce((sum, group) => sum + group.permissions.length, 0);

    expect(REGISTERED_PERMISSIONS).toHaveLength(total);
    for (const group of REGISTERED_PERMISSION_GROUPS) {
      for (const permission of group.permissions) {
        expect(REGISTERED_PERMISSIONS).toContainEqual({ ...permission, category: group.category });
      }
    }
  });

  it('权限编码常量与注册表必须双向一致', () => {
    const registeredCodes = REGISTERED_PERMISSIONS.map(permission => permission.code);

    expect(new Set(registeredCodes).size).toBe(registeredCodes.length);
    for (const code of declaredCodes) {
      expect(registeredCodes).toContain(code);
    }
    for (const code of registeredCodes) {
      expect(declaredCodes).toContain(code);
    }
  });
});

describe('权限分类工具', () => {
  it('未注册的分类回退为标识本身并排在已注册分类之后', () => {
    expect(getPermissionCategoryName('system')).toBe('系统管理');
    expect(getPermissionCategoryName('legacy')).toBe('legacy');
    expect(getPermissionCategoryOrder('legacy')).toBeGreaterThan(getPermissionCategoryOrder('system'));
  });
});
