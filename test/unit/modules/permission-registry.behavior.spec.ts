import { describe, expect, it } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import {
  collectDefinitionChanges,
  validatePermissionRegistry
} from '#/modules/permission/utils/permission-registry.util.js';
import { REGISTERED_PERMISSION_GROUPS } from '#/modules/permission/constants/registered-permissions.constant.js';
import type { RegisteredPermissionGroup } from '#/modules/permission/types/registered-permission.types.js';

const validGroups = structuredClone(REGISTERED_PERMISSION_GROUPS) as RegisteredPermissionGroup[];
type RegistryMutation = (groups: RegisteredPermissionGroup[]) => void;

describe('权限注册表一致性校验', () => {
  it('接受正式注册表并检测无差异定义', () => {
    expect(() => validatePermissionRegistry(validGroups)).not.toThrow();
    const permission = validGroups[0].permissions[0];
    expect(
      collectDefinitionChanges(
        { id: '1', category: validGroups[0].category, ...permission, isActive: true },
        { category: validGroups[0].category, ...permission }
      )
    ).toBeNull();
  });

  it.each([
    [
      '空分类',
      (groups: RegisteredPermissionGroup[]) => {
        groups[0].category = '';
      }
    ],
    [
      '重复分类',
      (groups: RegisteredPermissionGroup[]) => {
        groups.push(structuredClone(groups[0]));
      }
    ],
    [
      '空分类名称',
      (groups: RegisteredPermissionGroup[]) => {
        groups[0].name = '';
      }
    ],
    [
      '重复权限编码',
      (groups: RegisteredPermissionGroup[]) => {
        groups[1].permissions[0].code = groups[0].permissions[0].code;
      }
    ],
    [
      '非法权限编码',
      (groups: RegisteredPermissionGroup[]) => {
        groups[0].permissions[0].code = 'Invalid Code';
      }
    ],
    [
      '权限分类不匹配',
      (groups: RegisteredPermissionGroup[]) => {
        groups[0].permissions[0].code = 'asset.invalid.read';
      }
    ],
    [
      '空权限名称',
      (groups: RegisteredPermissionGroup[]) => {
        groups[0].permissions[0].name = '';
      }
    ],
    [
      '受保护权限可分配',
      (groups: RegisteredPermissionGroup[]) => {
        groups[0].permissions[0].isProtected = true;
      }
    ]
  ] as [string, RegistryMutation][])('%s 时拒绝注册表', (_name, mutate) => {
    const groups = structuredClone(validGroups) as RegisteredPermissionGroup[];
    mutate(groups);
    expect(() => validatePermissionRegistry(groups)).toThrow(BadRequestException);
  });

  it('检查常量与注册表双向对应，计算字段漂移补丁', () => {
    const groups = structuredClone(validGroups) as RegisteredPermissionGroup[];
    groups[0].permissions[0].code = 'system.unregistered.read';
    expect(() => validatePermissionRegistry(groups)).toThrow('权限注册校验失败');

    const current = {
      id: '1',
      category: 'legacy',
      code: 'system.audit.read',
      name: '旧名称',
      description: null,
      isAssignable: false,
      isProtected: true,
      isActive: true
    };
    const expected = {
      category: 'system',
      code: current.code,
      name: '新名称',
      description: '说明',
      isAssignable: true,
      isProtected: false
    };
    expect(collectDefinitionChanges(current, expected)).toEqual({
      category: 'system',
      name: '新名称',
      description: '说明',
      isAssignable: true,
      isProtected: false
    });
  });
});
