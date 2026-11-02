import { describe, expect, it } from 'vitest';
import { InMemoryPermissionRepository } from '../../../../../src/modules/permission/repositories/in-memory-permission.repository.js';
import { InMemoryRoleRepository } from '../../../../../src/modules/role/repositories/in-memory-role.repository.js';

const permission = {
  code: 'admin:get',
  resource: 'admin' as never,
  method: 'GET' as never,
  name: '读取管理员',
  description: null,
  isActive: true
};

describe('InMemory role and permission repositories', () => {
  it('removes a role by recording the deletion time', async () => {
    const roles = new InMemoryRoleRepository();
    const role = await roles.create({ code: 'removable', name: '可删除角色' });

    await roles.softDelete(role.id);

    await expect(roles.findById(role.id)).resolves.toBeNull();
    await expect(roles.findByCode('removable')).resolves.toBeNull();
    await expect(roles.list()).resolves.toMatchObject({ items: [], total: 0 });
  });

  it('应按页码返回角色并计算分页边界', async () => {
    const roles = new InMemoryRoleRepository();
    await roles.create({ code: 'one', name: '一' });
    await roles.create({ code: 'two', name: '二' });
    await roles.create({ code: 'three', name: '三' });

    const result = await roles.list({ page: 2, pageSize: 2, skip: 2 } as never);
    expect(result.items).toHaveLength(1);
    expect(result.total).toBe(3);
    expect(result.totalPages).toBe(2);
    expect(result.hasPreviousPage).toBe(true);
    expect(result.hasNextPage).toBe(false);
  });

  it('空页应返回正确的边界状态', async () => {
    const roles = new InMemoryRoleRepository();
    const first = await roles.create({ code: 'first', name: '一' });
    await roles.create({ code: 'second', name: '二' });
    await roles.softDelete(first.id);

    const result = await roles.list({
      page: 2,
      pageSize: 20,
      skip: 20
    } as never);
    expect(result.items).toEqual([]);
    expect(result.total).toBe(1);
    expect(result.totalPages).toBe(1);
    expect(result.hasPreviousPage).toBe(true);
    expect(result.hasNextPage).toBe(false);
  });

  it('finds roles and permissions by IDs without exposing mutable arrays', async () => {
    const roles = new InMemoryRoleRepository();
    const permissions = new InMemoryPermissionRepository();
    const storedPermission = await permissions.upsertRegistered(permission);
    const role = await roles.create({ code: 'operator', name: '普通管理员' });
    await roles.bindPermission(role.id, storedPermission.id);

    const foundRoles = await roles.findByIds([role.id]);
    const foundPermissions = await permissions.findByIds([storedPermission.id]);
    foundRoles[0].permissionIds.push('unexpected');

    expect(foundRoles[0].permissionIds).toEqual([storedPermission.id, 'unexpected']);
    await expect(roles.findById(role.id)).resolves.toMatchObject({
      permissionIds: [storedPermission.id]
    });
    expect(foundPermissions).toEqual([storedPermission]);
  });
});
