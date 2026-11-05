import type { BadRequestException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import type { PermissionRecord, RegisteredPermission } from '#/modules/authorization/types/permission.types.js';
import type { RegisteredPermissionGroup } from '#/modules/permission/constants/registered-permissions.constant.js';
import { REGISTERED_PERMISSION_GROUPS } from '#/modules/permission/constants/registered-permissions.constant.js';
import {
  collectDefinitionChanges,
  validatePermissionRegistry
} from '#/modules/permission/utils/permission-registry.util.js';

/** 构造仅包含已声明权限编码的合法分组，便于按用例覆盖单个字段。 */
function createGroup(overrides: Partial<RegisteredPermissionGroup> = {}): RegisteredPermissionGroup {
  return {
    category: 'system',
    name: '系统管理',
    permissions: [
      {
        code: 'system.audit.read',
        name: '查看审计',
        description: '查看管理员变更审计',
        isAssignable: true,
        isProtected: false
      }
    ],
    ...overrides
  };
}

/** 读取注册表校验异常携带的定位信息。 */
function catchErrorData(groups: readonly RegisteredPermissionGroup[]): Record<string, unknown> {
  try {
    validatePermissionRegistry(groups);
  } catch (error) {
    const response = (error as BadRequestException).getResponse() as { data: Record<string, unknown> };
    return response.data;
  }
  throw new Error('注册表校验未按预期失败');
}

describe('validatePermissionRegistry', () => {
  it('默认注册表应通过校验', () => {
    expect(() => validatePermissionRegistry(REGISTERED_PERMISSION_GROUPS)).not.toThrow();
  });

  it('重复的权限编码应阻止启动', () => {
    const group = createGroup();
    expect(catchErrorData([group, createGroup()])).toEqual({
      target: 'system',
      field: 'category',
      actual: 'system',
      expected: '唯一',
      resolution: '合并重复分组'
    });
    expect(catchErrorData([createGroup({ permissions: [...group.permissions, ...group.permissions] })]).field).toBe(
      'code'
    );
  });

  it('分类标识和展示名称必须可用', () => {
    expect(catchErrorData([createGroup({ category: '' })]).resolution).toBe('补齐分组分类标识');
    expect(catchErrorData([createGroup({ name: '' })]).resolution).toBe('补齐分组展示名称');
    expect(catchErrorData([createGroup({ name: 'system' })]).resolution).toBe('补齐分组展示名称');
  });

  it('权限编码必须小写分段且首段等于所在分组分类', () => {
    const invalid = createGroup({ permissions: [{ ...createGroup().permissions[0], code: 'System.Audit.Read' }] });
    expect(catchErrorData([invalid]).resolution).toBe('修正权限编码');
    const mismatched = createGroup({ category: 'audit', name: '审计管理' });
    expect(catchErrorData([mismatched])).toMatchObject({
      target: 'system.audit.read',
      field: 'category',
      actual: 'audit',
      expected: 'system'
    });
  });

  it('受保护权限不得同时可分配且名称不得为空', () => {
    const entry = createGroup().permissions[0];
    expect(catchErrorData([createGroup({ permissions: [{ ...entry, isProtected: true }] })]).resolution).toBe(
      '受保护权限不得绑定给普通角色'
    );
    expect(catchErrorData([createGroup({ permissions: [{ ...entry, name: '' }] })]).resolution).toBe('补齐权限名称');
  });

  it('注册表与权限编码常量必须双向一致', () => {
    const undeclared = createGroup({
      permissions: [{ ...createGroup().permissions[0], code: 'system.audit.export' }]
    });
    expect(catchErrorData([undeclared]).resolution).toBe('在 PermissionCode 中声明该权限编码');
    expect(catchErrorData([]).resolution).toBe('在权限注册表中补齐该权限定义');
  });
});

describe('collectDefinitionChanges', () => {
  const record: PermissionRecord = {
    id: 'permission-1',
    code: 'system.audit.read',
    name: '查看审计',
    description: '查看管理员变更审计',
    category: 'system',
    isAssignable: true,
    isProtected: false,
    isActive: false
  };
  const definition: RegisteredPermission = {
    code: 'system.audit.read',
    name: '查看审计',
    description: '查看管理员变更审计',
    category: 'system',
    isAssignable: true,
    isProtected: false
  };

  it('定义一致时不产生写入', () => {
    expect(collectDefinitionChanges(record, definition)).toBeNull();
  });

  it('只返回发生漂移的代码维护字段', () => {
    expect(collectDefinitionChanges({ ...record, name: '旧名称', isProtected: true }, definition)).toEqual({
      name: '查看审计',
      isProtected: false
    });
  });

  it('启用状态和权限编码不参与对齐', () => {
    expect(collectDefinitionChanges({ ...record, isActive: true }, definition)).toBeNull();
  });
});
