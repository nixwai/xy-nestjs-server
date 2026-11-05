import { describe, expect, it, vi } from 'vitest';
import { DomainNotFoundError } from '#/common/errors/index.js';
import { TypeOrmPermissionRepository } from '#/modules/permission/repositories/typeorm-permission.repository.js';

const permission = {
  id: 'permission-1',
  code: 'system.audit.read',
  category: 'system',
  isAssignable: true,
  isProtected: false,
  name: '查看审计',
  description: '查看管理员变更审计',
  isActive: true
};

const definition = {
  code: 'system.audit.read',
  category: 'system',
  isAssignable: true,
  isProtected: false,
  name: '查看审计',
  description: '查看管理员变更审计',
  isActive: true
};

describe('TypeOrmPermissionRepository', () => {
  function createRepository() {
    const permissions = {
      find: vi.fn().mockResolvedValue([permission]),
      findOne: vi.fn().mockResolvedValue(permission),
      save: vi.fn().mockImplementation(async item => item),
      create: vi.fn().mockImplementation(item => item),
      merge: vi.fn((item, patch) => Object.assign(item, patch)),
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

  it('应按编码查询权限并创建注册表权限', async () => {
    const { repository, permissions } = createRepository();

    await expect(repository.findByCode('system.audit.read')).resolves.toEqual(permission);
    expect(permissions.findOne).toHaveBeenCalledWith({ where: { code: 'system.audit.read' } });
    await expect(repository.create(definition)).resolves.toMatchObject({ code: 'system.audit.read' });
    expect(permissions.create).toHaveBeenCalledWith(definition);
    expect(permissions.save).toHaveBeenCalled();
  });

  it('应只合并代码维护字段', async () => {
    const { repository, permissions } = createRepository();

    await expect(repository.updateDefinition('permission-1', { name: '查看审计日志' })).resolves.toMatchObject({
      id: 'permission-1',
      name: '查看审计日志'
    });
    expect(permissions.merge).toHaveBeenCalledWith(permission, { name: '查看审计日志' });
  });

  it('对齐不存在的权限时抛出领域错误', async () => {
    const { repository, permissions } = createRepository();
    permissions.findOne = vi.fn().mockResolvedValue(null);

    await expect(repository.updateDefinition('missing', { name: '查看审计日志' })).rejects.toBeInstanceOf(
      DomainNotFoundError
    );
  });
});
