import { describe, expect, it, vi } from 'vitest';
import { TypeOrmRoleRepository } from '../../../../../src/modules/role/repositories/typeorm-role.repository.js';

function entity(overrides: Record<string, unknown> = {}) {
  return {
    id: 'role-1',
    code: 'operator',
    name: '普通管理员',
    description: null,
    isActive: true,
    deletedAt: null,
    permissions: [{ permissionId: 'permission-1' }],
    ...overrides,
  };
}

describe('TypeOrmRoleRepository', () => {
  function createRepository() {
    const roleEntity = entity();
    const roles = {
      find: vi.fn().mockResolvedValue([roleEntity]),
      findOne: vi.fn().mockResolvedValue(roleEntity),
      save: vi.fn().mockImplementation(async (item) => item),
      create: vi.fn().mockImplementation((item) => item),
      merge: vi
        .fn()
        .mockImplementation((target, input) => Object.assign(target, input)),
      softRemove: vi.fn().mockResolvedValue(roleEntity),
      createQueryBuilder: vi.fn().mockReturnValue({
        leftJoinAndSelect: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        getMany: vi.fn().mockResolvedValue([roleEntity]),
      }),
    };
    const rolePermissions = {
      findOne: vi.fn().mockResolvedValue(null),
      save: vi.fn().mockResolvedValue(undefined),
      create: vi.fn().mockImplementation((item) => item),
      delete: vi.fn().mockResolvedValue(undefined),
    };
    return {
      repository: new TypeOrmRoleRepository(
        roles as never,
        rolePermissions as never,
      ),
      roles,
      rolePermissions,
    };
  }

  it('应读取、创建、更新和软删除角色', async () => {
    const { repository, roles } = createRepository();

    await expect(repository.list()).resolves.toHaveLength(1);
    await expect(repository.findById('role-1')).resolves.toMatchObject({
      id: 'role-1',
    });
    await expect(repository.findByIds(['role-1'])).resolves.toHaveLength(1);
    await expect(repository.findByIds([])).resolves.toEqual([]);
    await expect(repository.findByCode('operator')).resolves.toMatchObject({
      code: 'operator',
    });
    await expect(
      repository.create({ code: 'new', name: '新角色' }),
    ).resolves.toMatchObject({ code: 'new' });
    await expect(
      repository.update('role-1', { name: '更新角色' }),
    ).resolves.toMatchObject({ name: '更新角色' });
    await repository.remove('role-1');

    expect(roles.softRemove).toHaveBeenCalled();
  });

  it('应绑定、解绑权限并处理重复关系', async () => {
    const { repository, rolePermissions } = createRepository();

    await repository.bindPermission('role-1', 'permission-1');
    await repository.unbindPermission('role-1', 'permission-1');
    expect(rolePermissions.delete).toHaveBeenCalledWith({
      roleId: 'role-1',
      permissionId: 'permission-1',
    });

    rolePermissions.findOne.mockResolvedValueOnce({ id: 'relation-1' });
    await expect(
      repository.bindPermission('role-1', 'permission-1'),
    ).rejects.toMatchObject({ message: '角色权限关系已存在' });
  });
});
