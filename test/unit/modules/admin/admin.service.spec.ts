import { ForbiddenException } from '@nestjs/common';
import { beforeEach, describe, expect, it } from 'vitest';
import { AdminService } from '../../../../src/modules/admin/admin.service.js';
import { InMemoryAdminRepository } from '../../../../src/modules/admin/repositories/in-memory-admin.repository.js';
import { InMemoryAdminTransactionRunner } from '../../../../src/modules/admin/repositories/admin-transaction-runner.js';
import { AuditService } from '../../../../src/modules/audit/audit.service.js';
import { RoleService } from '../../../../src/modules/role/role.service.js';

const roleService = {
  findByCode: async () => null,
  findById: async () => null,
} as unknown as RoleService;

describe('AdminService', () => {
  let repository: InMemoryAdminRepository;
  let service: AdminService;

  beforeEach(async () => {
    repository = new InMemoryAdminRepository();
    service = new AdminService(
      repository,
      roleService,
      new AuditService(),
      new InMemoryAdminTransactionRunner(repository),
    );
    await service.createInitialAdmin({
      username: 'root',
      passwordHash: 'hash',
      passwordSalt: 'salt',
    });
  });

  it('requires the operator password when updating a super administrator', async () => {
    await expect(
      service.updateAdmin('1', { id: '1', username: 'root-2' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    await expect(
      service.updateAdmin('1', {
        id: '1',
        username: 'root-2',
        currentPassword: 'Wrong1234',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('prevents removing the last active super administrator', async () => {
    await expect(
      service.removeAdmin('1', '1', 'Root1234'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
