import { describe, expect, it, vi } from 'vitest';
import { TypeOrmPermissionRepository } from '#/modules/permission/repositories/typeorm-permission.repository.js';

const permission = {
  id: 'permission-1',
  code: 'role.read',
  category: '角色',
  isAssignable: true,
  isProtected: false,
  name: '查询角色',
  description: null,
  isActive: true
};

describe('TypeOrmPermissionRepository', () => {
  function createRepository() {
    const permissions = {
      find: vi.fn().mockResolvedValue([permission]),
      findOne: vi.fn().mockResolvedValue(permission),
      save: vi.fn().mockImplementation(async item => item),
      create: vi.fn().mockImplementation(item => item),
      createQueryBuilder: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnThis(),
        getMany: vi.fn().mockResolvedValue([permission])
      })
    };
    return {
      repository: new TypeOrmPermissionRepository(permissions as never),
      permissions
    };
  }

  it('应读取和批量查询权限', async () => {
    const { repository } = createRepository();

    await expect(repository.list()).resolves.toEqual([permission]);
    await expect(repository.findById('permission-1')).resolves.toMatchObject({
      id: 'permission-1'
    });
    await expect(repository.findByIds(['permission-1'])).resolves.toEqual([permission]);
    await expect(repository.findByIds([])).resolves.toEqual([]);
  });

});
