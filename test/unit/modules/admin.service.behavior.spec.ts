import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { AdminService } from '#/modules/admin/admin.service.js';
import type { AdminRepository, AdminTransactionRunner } from '#/modules/admin/repositories/admin-repository.port.js';
import type { AdminRecord } from '#/modules/admin/types/admin.types.js';
import type { RoleService } from '#/modules/role/role.service.js';
import type { AuditService } from '#/modules/audit/audit.service.js';
import { hashPassword } from '#/common/utils/password-hash.util.js';

const now = new Date('2026-01-01T00:00:00.000Z');

function createAdmin(overrides: Partial<AdminRecord> = {}): AdminRecord {
  return {
    id: '1',
    username: 'root',
    passwordHash: 'hash',
    passwordSalt: 'salt',
    isActive: true,
    isRoot: true,
    deletedAt: null,
    createdAt: now,
    updatedAt: now,
    ...overrides
  };
}

function createService(
  options: {
    repository?: Partial<AdminRepository>;
    roleService?: Partial<RoleService>;
    auditService?: Partial<AuditService>;
  } = {}
) {
  const repository: Partial<AdminRepository> = {
    findById: vi.fn().mockResolvedValue(createAdmin()),
    findByUsername: vi.fn().mockResolvedValue(null),
    list: vi.fn().mockResolvedValue({
      items: [createAdmin()],
      total: 1,
      page: 1,
      pageSize: 20,
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: false
    }),
    listRoleIds: vi.fn().mockResolvedValue([]),
    listRoleIdsByAdminIds: vi.fn().mockResolvedValue(new Map([['1', []]])),
    countActiveRoots: vi.fn().mockResolvedValue(2),
    create: vi.fn().mockResolvedValue(createAdmin()),
    update: vi.fn().mockResolvedValue(createAdmin()),
    softDelete: vi.fn().mockResolvedValue(undefined),
    bindRole: vi.fn().mockResolvedValue(undefined),
    unbindRole: vi.fn().mockResolvedValue(undefined),
    ...options.repository
  };
  const roleService: Partial<RoleService> = {
    findByCode: vi.fn().mockResolvedValue(null),
    findById: vi.fn().mockResolvedValue({ id: 'role-1' }),
    ...options.roleService
  };
  const auditService: Partial<AuditService> = {
    record: vi.fn().mockResolvedValue(undefined),
    ...options.auditService
  };
  const transactionRunner: AdminTransactionRunner = {
    run: work => work(repository as AdminRepository)
  };

  return {
    service: new AdminService(
      repository as AdminRepository,
      roleService as RoleService,
      auditService as AuditService,
      transactionRunner
    ),
    repository,
    roleService,
    auditService
  };
}

describe('管理员账户业务行为', () => {
  it('公开服务方法委托查询和初始化语义', async () => {
    const { service, repository } = createService({
      repository: {
        findByUsername: vi.fn().mockResolvedValue(createAdmin()),
        listRoleIds: vi.fn().mockResolvedValue(['role-1']),
        listRoleIdsByAdminIds: vi.fn().mockResolvedValue(new Map([['1', ['role-1']]]))
      }
    });

    await expect(service.findById('1')).resolves.toMatchObject({ id: '1' });
    await expect(service.findByUsername('root')).resolves.toMatchObject({ username: 'root' });
    await expect(service.listAdminRoleIds('1')).resolves.toEqual(['role-1']);
    await expect(service.listAdminRoleIdsByAdminIds(['1'])).resolves.toEqual(new Map([['1', ['role-1']]]));
    await expect(
      service.createInitialAdmin({ username: 'initial', passwordHash: 'hash', passwordSalt: 'salt' })
    ).resolves.toMatchObject({ id: '1' });
    expect(repository.create).toHaveBeenCalledWith(expect.objectContaining({ isRoot: true }));
  });

  it('列表和当前管理员查询只返回公开字段及角色关系', async () => {
    const { service } = createService({
      repository: {
        list: vi.fn().mockResolvedValue({
          items: [createAdmin({ id: '1' }), createAdmin({ id: '2', username: 'operator' })],
          total: 2,
          page: 1,
          pageSize: 20,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false
        }),
        listRoleIdsByAdminIds: vi.fn().mockResolvedValue(
          new Map([
            ['1', ['role-1']],
            ['2', []]
          ])
        ),
        listRoleIds: vi.fn().mockResolvedValue(['role-1'])
      }
    });

    await expect(service.listAdmins()).resolves.toMatchObject({
      items: [
        { id: '1', roleIds: ['role-1'] },
        { id: '2', roleIds: [] }
      ],
      total: 2
    });
    await expect(service.getMe('1')).resolves.toMatchObject({ id: '1', username: 'root', roleIds: ['role-1'] });
  });

  it('查询不存在账号时返回资源缺失', async () => {
    const { service } = createService({ repository: { findById: vi.fn().mockResolvedValue(null) } });

    await expect(service.getMe('missing')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('创建普通管理员时哈希密码、绑定 operator 角色并记录审计', async () => {
    const created = createAdmin({ id: '2', username: 'operator', isRoot: false });
    const { service, repository, auditService } = createService({
      repository: { create: vi.fn().mockResolvedValue(created), listRoleIds: vi.fn().mockResolvedValue(['role-1']) },
      roleService: { findByCode: vi.fn().mockResolvedValue({ id: 'role-1' }) }
    });

    const result = await service.createAdmin('1', { username: 'operator', password: 'Operator1234', isRoot: false });

    expect(result).toMatchObject({ id: '2', roleIds: ['role-1'], isRoot: false });
    expect(repository.create).toHaveBeenCalledWith(expect.objectContaining({ username: 'operator', isRoot: false }));
    expect(repository.bindRole).toHaveBeenCalledWith('2', 'role-1');
    expect(auditService.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'admin.create', targetId: '2' })
    );
  });

  it('创建根管理员必须校验当前密码，错误密码不能写入', async () => {
    const { service, repository } = createService();

    await expect(
      service.createAdmin('1', { username: 'root-2', password: 'Root1234', isRoot: true })
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      service.createAdmin('1', { username: 'root-2', password: 'Root1234', isRoot: true, currentPassword: 'Wrong1234' })
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(repository.create).not.toHaveBeenCalled();
  });

  it('更新根管理员的敏感状态时不能移除最后一个启用根管理员', async () => {
    const { service, repository } = createService({ repository: { countActiveRoots: vi.fn().mockResolvedValue(1) } });

    await expect(
      service.updateAdmin('1', { id: '1', isActive: false, currentPassword: 'Current1234' })
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(repository.update).not.toHaveBeenCalled();
  });

  it('重置密码和软删除都要求当前密码，并记录对应审计', async () => {
    const password = await hashPassword('Current1234');
    const { service, repository, auditService } = createService({
      repository: {
        findById: vi.fn().mockResolvedValue(createAdmin({ passwordHash: password.hash, passwordSalt: password.salt }))
      }
    });

    await expect(service.resetAdminPassword('1', '1', 'NewPass123', 'Current1234')).resolves.toMatchObject({ id: '1' });
    await expect(service.softDeleteAdmin('1', '1', 'Current1234')).resolves.toBeNull();
    expect(repository.softDelete).toHaveBeenCalledWith('1');
    expect(auditService.record).toHaveBeenCalledWith(expect.objectContaining({ action: 'admin.soft-delete' }));
  });

  it('绑定或解绑角色前验证管理员和角色存在', async () => {
    const { service, repository, roleService } = createService();

    await expect(service.bindRole('1', '1', 'role-1')).resolves.toBeNull();
    await expect(service.unbindRole('1', '1', 'role-1')).resolves.toBeNull();
    expect(repository.bindRole).toHaveBeenCalledWith('1', 'role-1');
    expect(repository.unbindRole).toHaveBeenCalledWith('1', 'role-1');

    vi.mocked(roleService.findById!).mockResolvedValueOnce(null);
    await expect(service.bindRole('1', '1', 'missing')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('更新管理员时支持普通字段、密码变更和根状态校验', async () => {
    const password = await hashPassword('Current1234');
    const updated = createAdmin({ username: 'updated', isRoot: false });
    const { service, repository } = createService({
      repository: {
        findById: vi.fn().mockResolvedValue(createAdmin({ passwordHash: password.hash, passwordSalt: password.salt })),
        update: vi.fn().mockResolvedValue(updated),
        listRoleIds: vi.fn().mockResolvedValue([])
      }
    });

    await expect(
      service.updateAdmin('1', { id: '1', username: 'updated', currentPassword: 'Current1234' })
    ).resolves.toMatchObject({ username: 'updated' });
    await expect(
      service.updateAdmin('1', { id: '1', password: 'NewPass123', currentPassword: 'Current1234' })
    ).resolves.toBeDefined();
    expect(repository.update).toHaveBeenCalledWith(
      '1',
      expect.objectContaining({ passwordHash: expect.any(String), passwordSalt: expect.any(String) })
    );
  });

  it('删除不存在管理员或密码错误时不执行事务', async () => {
    const missing = createService({ repository: { findById: vi.fn().mockResolvedValue(null) } });
    await expect(missing.service.softDeleteAdmin('1', 'missing', 'Current1234')).rejects.toBeInstanceOf(
      NotFoundException
    );

    const wrong = createService();
    await expect(wrong.service.softDeleteAdmin('1', '1', 'Wrong1234')).rejects.toBeInstanceOf(ForbiddenException);
    expect(wrong.repository.softDelete).not.toHaveBeenCalled();
  });
});
