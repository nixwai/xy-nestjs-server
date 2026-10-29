import { describe, expect, it, vi } from 'vitest';
import { TypeOrmPermissionRepository } from '../../../../../src/modules/permission/repositories/typeorm-permission.repository.js';

const permission = {
  id: 'permission-1',
  code: 'role:get',
  resource: 'role',
  method: 'GET',
  name: '查询角色',
  description: null,
  isActive: true,
};

describe('TypeOrmPermissionRepository', () => {
  function createRepository() {
    const permissions = {
      find: vi.fn().mockResolvedValue([permission]),
      findOne: vi.fn().mockResolvedValue(permission),
      save: vi.fn().mockImplementation(async (item) => item),
      create: vi.fn().mockImplementation((item) => item),
      merge: vi
        .fn()
        .mockImplementation((target, input) => Object.assign(target, input)),
      createQueryBuilder: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnThis(),
        getMany: vi.fn().mockResolvedValue([permission]),
      }),
    };
    return {
      repository: new TypeOrmPermissionRepository(permissions as never),
      permissions,
    };
  }

  it('应读取和批量查询权限', async () => {
    const { repository } = createRepository();

    await expect(repository.list()).resolves.toEqual([permission]);
    await expect(repository.findById('permission-1')).resolves.toMatchObject({
      id: 'permission-1',
    });
    await expect(repository.findByIds(['permission-1'])).resolves.toEqual([
      permission,
    ]);
    await expect(repository.findByIds([])).resolves.toEqual([]);
  });

  it('应创建或更新注册权限并修改状态', async () => {
    const { repository, permissions } = createRepository();

    const input = {
      code: permission.code,
      resource: permission.resource as never,
      method: permission.method as never,
      name: permission.name,
      description: permission.description,
      isActive: permission.isActive,
    };
    await repository.upsertRegistered(input);
    permissions.findOne.mockResolvedValueOnce(null);
    await repository.upsertRegistered(input);
    await expect(
      repository.setActive('permission-1', false),
    ).resolves.toMatchObject({ isActive: false });
  });
});
