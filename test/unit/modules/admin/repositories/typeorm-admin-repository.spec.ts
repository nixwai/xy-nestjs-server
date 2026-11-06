import { describe, expect, it, vi } from 'vitest';
import { TypeOrmAdminRepository } from '#/modules/admin/repositories/typeorm-admin.repository.js';
/** 构造测试实体 */
function createEntity(overrides: Record<string, unknown> = {}) {
  return {
    id: '1',
    username: 'admin',
    passwordHash: 'hash',
    passwordSalt: 'salt',
    isActive: true,
    isRoot: true,
    deletedAt: null,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides
  };
}

describe('TypeOrmAdminRepository', () => {
  /** 构造测试仓储 */
  function createRepository() {
    const entity = createEntity();
    const adminRepository = {
      findOne: vi.fn().mockResolvedValue(entity),
      find: vi.fn().mockResolvedValue([entity]),
      findAndCount: vi.fn().mockResolvedValue([[entity], 1]),
      save: vi.fn().mockImplementation(async item => item),
      create: vi.fn().mockImplementation(item => item),
      merge: vi.fn().mockImplementation((target, input) => Object.assign(target, input)),
      softRemove: vi.fn().mockResolvedValue(entity),
      count: vi.fn().mockResolvedValue(2)
    };
    const roleRepository = {
      find: vi.fn().mockResolvedValue([{ adminId: '1', roleId: 'role-1' }]),
      findOne: vi.fn().mockResolvedValue(null),
      save: vi.fn().mockResolvedValue(undefined),
      create: vi.fn().mockImplementation(item => item),
      delete: vi.fn().mockResolvedValue(undefined),
      createQueryBuilder: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnThis(),
        getMany: vi.fn().mockResolvedValue([{ adminId: '1', roleId: 'role-1' }])
      })
    };
    return {
      repository: new TypeOrmAdminRepository(
        adminRepository as never,
        roleRepository as never,
        { update: vi.fn().mockResolvedValue(undefined) } as never
      ),
      adminRepository,
      roleRepository,
      entity
    };
  }

  it('应读取、创建、更新和软删除管理员', async () => {
    const { repository, adminRepository } = createRepository();

    await expect(repository.findByUsername('admin')).resolves.toMatchObject({
      username: 'admin'
    });
    await expect(repository.findById('1')).resolves.toMatchObject({ id: '1' });
    await expect(repository.list()).resolves.toMatchObject({
      items: [expect.objectContaining({ id: '1' })],
      total: 1
    });
    await expect(
      repository.create({
        username: 'new',
        passwordHash: 'h',
        passwordSalt: 's'
      })
    ).resolves.toMatchObject({ username: 'new' });
    await expect(repository.update('1', { username: 'updated' })).resolves.toMatchObject({ username: 'updated' });
    await repository.softDelete('1');

    expect(adminRepository.softRemove).toHaveBeenCalled();
  });

  it('应将分页参数传递给数据库并计算分页元数据', async () => {
    const { repository, adminRepository } = createRepository();
    adminRepository.findAndCount.mockResolvedValue([[createEntity(), createEntity({ id: '2' })], 3]);

    const result = await repository.list({
      page: 2,
      pageSize: 2,
      skip: 2
    } as never);
    expect(result).toMatchObject({
      page: 2,
      pageSize: 2,
      total: 3,
      totalPages: 2,
      hasPreviousPage: true,
      hasNextPage: false
    });
    expect(adminRepository.findAndCount).toHaveBeenCalledWith({
      order: { createdAt: 'DESC', id: 'DESC' },
      skip: 2,
      take: 2
    });
  });

  it('总数为零时应返回零页', async () => {
    const { repository, adminRepository } = createRepository();
    adminRepository.findAndCount.mockResolvedValue([[], 0]);

    await expect(repository.list({ page: 1, pageSize: 20, skip: 0 } as never)).resolves.toMatchObject({
      items: [],
      total: 0,
      totalPages: 0,
      hasNextPage: false,
      hasPreviousPage: false
    });
  });

  it('找不到管理员时应返回空值', async () => {
    const { repository, adminRepository } = createRepository();
    adminRepository.findOne.mockResolvedValue(null);

    await expect(repository.findByUsername('missing')).resolves.toBeNull();
    await expect(repository.findById('missing')).resolves.toBeNull();
  });

  it('应处理根管理员统计、角色关系和空查询', async () => {
    const { repository, adminRepository, roleRepository } = createRepository();

    await expect(repository.countActiveRoots()).resolves.toBe(2);
    await expect(repository.listRoleIds('1')).resolves.toEqual(['role-1']);
    await expect(repository.listRoleIdsByAdminIds([])).resolves.toEqual(new Map());
    await expect(repository.listRoleIdsByAdminIds(['1'])).resolves.toEqual(new Map([['1', ['role-1']]]));
    await repository.bindRole('1', 'role-1');
    await repository.unbindRole('1', 'role-1');

    expect(adminRepository.count).toHaveBeenCalled();
    expect(roleRepository.delete).toHaveBeenCalledWith({
      adminId: '1',
      roleId: 'role-1'
    });
  });

  it('唯一键冲突时应转换为领域冲突', async () => {
    const { repository, adminRepository } = createRepository();
    adminRepository.save.mockRejectedValueOnce({ code: 'ER_DUP_ENTRY' });

    await expect(
      repository.create({
        username: 'duplicate',
        passwordHash: 'h',
        passwordSalt: 's'
      })
    ).rejects.toMatchObject({ message: '管理员用户名已存在' });
  });
});
