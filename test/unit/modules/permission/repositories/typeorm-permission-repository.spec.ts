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

  it('应创建或更新注册权限并保留已有启用状态', async () => {
    const { repository, permissions } = createRepository();

    const input = {
      code: permission.code,
      category: '更新分类',
      isAssignable: false,
      isProtected: true,
      name: '更新后的查询角色',
      description: '更新后的描述',
      isActive: permission.isActive
    };
    permissions.findOne.mockResolvedValueOnce({ ...permission, isActive: false });
    await expect(repository.ensureRegistered(input)).resolves.toMatchObject({
      isActive: false,
      category: '更新分类',
      isAssignable: false,
      isProtected: true,
      name: '更新后的查询角色',
      description: '更新后的描述'
    });
    expect(permissions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        code: permission.code,
        isActive: false
      })
    );

    permissions.findOne.mockResolvedValueOnce(null);
    await expect(repository.ensureRegistered(input)).resolves.toMatchObject({
      isActive: permission.isActive
    });
    await expect(repository.setActive('permission-1', false)).resolves.toMatchObject({ isActive: false });
  });
});
