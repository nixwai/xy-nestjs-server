import { describe, expect, it } from 'vitest';
import { DomainConflictError } from '#/common/errors/index.js';
import { InMemoryAdminRepository } from '#/modules/admin/repositories/in-memory-admin.repository.js';

function adminInput(username: string) {
  return { username, passwordHash: 'hash', passwordSalt: 'salt' };
}

describe('InMemoryAdminRepository', () => {
  it('returns role IDs for multiple administrators in one result', async () => {
    const repository = new InMemoryAdminRepository();
    const first = await repository.create(adminInput('first'));
    const second = await repository.create(adminInput('second'));
    await repository.bindRole(first.id, 'role-1');
    await repository.bindRole(second.id, 'role-2');

    await expect(repository.listRoleIdsByAdminIds([first.id, second.id])).resolves.toEqual(
      new Map([
        [first.id, ['role-1']],
        [second.id, ['role-2']]
      ])
    );
  });

  it('removes an administrator by recording the deletion time', async () => {
    const repository = new InMemoryAdminRepository();
    const admin = await repository.create(adminInput('removable'));

    await repository.softDelete(admin.id);

    await expect(repository.findById(admin.id)).resolves.toBeNull();
    await expect(repository.findByUsername('removable')).resolves.toBeNull();
    await expect(repository.list()).resolves.toMatchObject({
      items: [],
      total: 0
    });
  });

  it('应按创建时间和 ID 倒序分页并返回元数据', async () => {
    const repository = new InMemoryAdminRepository();
    await repository.create(adminInput('first'));
    await repository.create(adminInput('second'));
    await repository.create(adminInput('third'));

    const result = await repository.list({
      page: 2,
      pageSize: 2,
      skip: 2
    } as never);
    expect(result.items).toHaveLength(1);
    expect(result.total).toBe(3);
    expect(result.totalPages).toBe(2);
    expect(result.hasPreviousPage).toBe(true);
    expect(result.hasNextPage).toBe(false);
  });

  it('空页应返回正确的边界状态', async () => {
    const repository = new InMemoryAdminRepository();
    const first = await repository.create(adminInput('first'));
    await repository.create(adminInput('second'));
    await repository.softDelete(first.id);

    const result = await repository.list({
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

  it('rejects duplicate usernames with a domain conflict', async () => {
    const repository = new InMemoryAdminRepository();
    await repository.create(adminInput('admin'));

    await expect(repository.create(adminInput('admin'))).rejects.toBeInstanceOf(DomainConflictError);
  });
});
