import { describe, expect, it } from 'vitest';
import { DomainConflictError } from '../../../../../src/common/errors/index.js';
import { InMemoryAdminRepository } from '../../../../../src/modules/admin/repositories/in-memory-admin.repository.js';

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

    await expect(
      repository.listRoleIdsByAdminIds([first.id, second.id]),
    ).resolves.toEqual(
      new Map([
        [first.id, ['role-1']],
        [second.id, ['role-2']],
      ]),
    );
  });

  it('rejects duplicate usernames with a domain conflict', async () => {
    const repository = new InMemoryAdminRepository();
    await repository.create(adminInput('admin'));

    await expect(repository.create(adminInput('admin'))).rejects.toBeInstanceOf(
      DomainConflictError,
    );
  });
});
