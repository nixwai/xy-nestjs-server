import { BadRequestException, NotFoundException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { AdminService } from '../../../../src/modules/admin/admin.service.js';
import type {
  AdminRepository,
  AdminTransactionRunner,
} from '../../../../src/modules/admin/repositories/admin-repository.port.js';
import type { AdminRecord } from '../../../../src/modules/admin/types/admin.types.js';
import { hashPassword } from '../../../../src/modules/auth/utils/password.util.js';
import type { RoleService } from '../../../../src/modules/role/role.service.js';
import type { AuditService } from '../../../../src/modules/audit/audit.service.js';

const now = new Date('2026-01-01T00:00:00.000Z');

function admin(overrides: Partial<AdminRecord> = {}): AdminRecord {
  return {
    id: '1',
    username: 'root',
    passwordHash: 'hash',
    passwordSalt: 'salt',
    isActive: true,
    isSuperAdmin: true,
    deletedAt: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function createService(
  options: {
    repository?: Partial<AdminRepository>;
    roleService?: Partial<RoleService>;
    auditService?: Partial<AuditService>;
  } = {},
): {
  service: AdminService;
  repository: Partial<AdminRepository>;
  auditService: Partial<AuditService>;
} {
  const repository: Partial<AdminRepository> = {
    findById: vi.fn().mockResolvedValue(admin()),
    findByUsername: vi.fn().mockResolvedValue(null),
    list: vi.fn().mockResolvedValue([admin()]),
    listRoleIds: vi.fn().mockResolvedValue([]),
    listRoleIdsByAdminIds: vi.fn().mockResolvedValue(new Map([['1', []]])),
    countActiveSuperAdmins: vi.fn().mockResolvedValue(2),
    create: vi.fn().mockResolvedValue(admin()),
    update: vi.fn().mockResolvedValue(admin()),
    softDelete: vi.fn().mockResolvedValue(undefined),
    bindRole: vi.fn().mockResolvedValue(undefined),
    unbindRole: vi.fn().mockResolvedValue(undefined),
    ...options.repository,
  };
  const roleService: Partial<RoleService> = {
    findByCode: vi.fn().mockResolvedValue(null),
    findById: vi.fn().mockResolvedValue({ id: 'role-1' }),
    ...options.roleService,
  };
  const auditService: Partial<AuditService> = {
    record: vi.fn().mockResolvedValue(undefined),
    ...options.auditService,
  };
  const transactionRunner: AdminTransactionRunner = {
    run: (work) => work(repository as AdminRepository),
  };

  return {
    service: new AdminService(
      repository as AdminRepository,
      roleService as RoleService,
      auditService as AuditService,
      transactionRunner,
    ),
    repository,
    auditService,
  };
}

describe('AdminService', () => {
  it('应返回管理员列表并映射角色 ID', async () => {
    const { service } = createService({
      repository: {
        list: vi.fn().mockResolvedValue([admin(), admin({ id: '2' })]),
        listRoleIdsByAdminIds: vi.fn().mockResolvedValue(
          new Map([
            ['1', ['role-1']],
            ['2', []],
          ]),
        ),
      },
    });

    await expect(service.listAdmins()).resolves.toEqual([
      expect.objectContaining({ id: '1', roleIds: ['role-1'] }),
      expect.objectContaining({ id: '2', roleIds: [] }),
    ]);
  });

  it('查询不存在的管理员时应抛出 NotFoundException', async () => {
    const { service } = createService({
      repository: { findById: vi.fn().mockResolvedValue(null) },
    });

    await expect(service.getMe('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('创建普通管理员时应绑定默认角色并记录审计', async () => {
    const created = admin({
      id: '2',
      username: 'operator',
      isSuperAdmin: false,
    });
    const { service, repository, auditService } = createService({
      repository: {
        create: vi.fn().mockResolvedValue(created),
        listRoleIds: vi.fn().mockResolvedValue(['role-1']),
      },
      roleService: {
        findByCode: vi.fn().mockResolvedValue({ id: 'role-1' }),
      },
    });

    const result = await service.createAdmin('1', {
      username: 'operator',
      password: 'Admin1234',
      isSuperAdmin: false,
    });

    expect(result).toMatchObject({ id: '2', roleIds: ['role-1'] });
    expect(repository.bindRole).toHaveBeenCalledWith('2', 'role-1');
    expect(auditService.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'admin.create', targetId: '2' }),
    );
  });

  it('创建超级管理员缺少当前密码时应拒绝', async () => {
    const { service } = createService();

    await expect(
      service.createAdmin('1', {
        username: 'root-2',
        password: 'Admin1234',
        isSuperAdmin: true,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('创建超级管理员当前密码错误时应拒绝', async () => {
    const password = await hashPassword('Admin1234');
    const { service } = createService({
      repository: {
        findById: vi
          .fn()
          .mockResolvedValue(
            admin({ passwordHash: password.hash, passwordSalt: password.salt }),
          ),
      },
    });

    await expect(
      service.createAdmin('1', {
        username: 'root-2',
        password: 'Admin1234',
        currentPassword: 'Wrong1234',
        isSuperAdmin: true,
      }),
    ).rejects.toThrow('当前密码错误');
  });

  it('更新管理员时应支持修改密码并记录审计', async () => {
    const password = await hashPassword('Admin1234');
    const updated = admin({ username: 'root-2' });
    const { service, repository } = createService({
      repository: {
        findById: vi
          .fn()
          .mockResolvedValue(
            admin({ passwordHash: password.hash, passwordSalt: password.salt }),
          ),
        update: vi.fn().mockResolvedValue(updated),
        listRoleIds: vi.fn().mockResolvedValue([]),
      },
    });

    await service.updateAdmin('1', {
      id: '1',
      username: 'root-2',
      currentPassword: 'Admin1234',
      password: 'NewAdmin1234',
    });

    expect(repository.update).toHaveBeenCalledWith(
      '1',
      expect.objectContaining({
        username: 'root-2',
        passwordHash: expect.any(String),
      }),
    );
  });

  it('删除管理员时应记录删除和审计', async () => {
    const password = await hashPassword('Admin1234');
    const { service, repository, auditService } = createService({
      repository: {
        findById: vi
          .fn()
          .mockResolvedValue(
            admin({ passwordHash: password.hash, passwordSalt: password.salt }),
          ),
      },
    });

    await expect(
      service.softDeleteAdmin('1', '1', 'Admin1234'),
    ).resolves.toBeNull();
    expect(repository.softDelete).toHaveBeenCalledWith('1');
    expect(auditService.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'admin.soft-delete' }),
    );
  });

  it('绑定角色时应校验管理员和角色是否存在', async () => {
    const { service } = createService({
      repository: { findById: vi.fn().mockResolvedValue(null) },
    });
    await expect(
      service.bindRole('1', 'missing', 'role-1'),
    ).rejects.toBeInstanceOf(NotFoundException);

    const { service: roleService } = createService({
      roleService: { findById: vi.fn().mockResolvedValue(null) },
    });
    await expect(
      roleService.bindRole('1', '1', 'missing'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
