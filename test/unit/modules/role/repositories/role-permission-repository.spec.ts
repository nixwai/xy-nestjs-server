import { describe, expect, it } from 'vitest';
import { InMemoryPermissionRepository } from '../../../../../src/modules/permission/repositories/in-memory-permission.repository.js';
import { InMemoryRoleRepository } from '../../../../../src/modules/role/repositories/in-memory-role.repository.js';

const permission = {
  code: 'admin:get',
  resource: 'admin' as never,
  method: 'GET' as never,
  name: '读取管理员',
  description: null,
  isActive: true,
};

describe('InMemory role and permission repositories', () => {
  it('removes a role by recording the deletion time', async () => {
    const roles = new InMemoryRoleRepository();
    const role = await roles.create({ code: 'removable', name: '可删除角色' });

    await roles.softDelete(role.id);

    await expect(roles.findById(role.id)).resolves.toBeNull();
    await expect(roles.findByCode('removable')).resolves.toBeNull();
    await expect(roles.list()).resolves.toEqual([]);
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

    expect(foundRoles[0].permissionIds).toEqual([
      storedPermission.id,
      'unexpected',
    ]);
    await expect(roles.findById(role.id)).resolves.toMatchObject({
      permissionIds: [storedPermission.id],
    });
    expect(foundPermissions).toEqual([storedPermission]);
  });
});
