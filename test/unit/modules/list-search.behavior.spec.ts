import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { describe, expect, it } from 'vitest';
import { AdminListQueryDto } from '#/modules/admin/dto/index.js';
import { InMemoryAdminRepository } from '#/modules/admin/repositories/in-memory-admin.repository.js';
import { AuditLogListQueryDto } from '#/modules/audit/dto/index.js';
import { AuditService } from '#/modules/audit/audit.service.js';
import { RoleListQueryDto } from '#/modules/role/dto/index.js';
import { InMemoryRoleRepository } from '#/modules/role/repositories/in-memory-role.repository.js';
import { UserListQueryDto } from '#/modules/user/dto/index.js';
import { InMemoryUserRepository } from '#/modules/user/repositories/in-memory-user.repository.js';

describe('后台列表搜索契约', () => {
  it('校验分页列表的独立搜索条件并转换布尔查询参数', async () => {
    const adminQuery = plainToInstance(AdminListQueryDto, {
      id: 'admin-1',
      username: 'operator',
      isActive: 'false',
      isRoot: 'true'
    });
    const roleQuery = plainToInstance(RoleListQueryDto, { code: 'operator', name: '运营', isActive: 'true' });
    const userQuery = plainToInstance(UserListQueryDto, {
      id: 'user-1',
      openId: 'open-id',
      unionId: 'union-id',
      nickname: '小明'
    });
    const auditQuery = plainToInstance(AuditLogListQueryDto, {
      actorAdminId: 'admin-1',
      targetId: 'target-1',
      action: 'admin.update',
      resourceType: 'admin',
      succeeded: 'false'
    });

    expect(await validate(adminQuery)).toHaveLength(0);
    expect(await validate(roleQuery)).toHaveLength(0);
    expect(await validate(userQuery)).toHaveLength(0);
    expect(await validate(auditQuery)).toHaveLength(0);
    expect(adminQuery).toMatchObject({ isActive: false, isRoot: true });
    expect(roleQuery.isActive).toBe(true);
    expect(auditQuery.succeeded).toBe(false);
  });

  it('管理员列表按 ID、用户名、启用状态和管理员类型筛选', async () => {
    const repository = new InMemoryAdminRepository();
    const root = await repository.create({
      username: 'root',
      passwordHash: 'hash',
      passwordSalt: 'salt',
      isRoot: true
    });
    await repository.create({ username: 'operator', passwordHash: 'hash', passwordSalt: 'salt', isRoot: false });
    const inactive = await repository.create({
      username: 'disabled',
      passwordHash: 'hash',
      passwordSalt: 'salt',
      isRoot: false
    });
    await repository.update(inactive.id, { isActive: false });

    const result = await repository.list(
      Object.assign(new AdminListQueryDto(), { id: root.id, username: 'root', isActive: true, isRoot: true })
    );

    expect(result.items).toMatchObject([{ id: root.id, username: 'root', isActive: true, isRoot: true }]);
    expect(result.total).toBe(1);
  });

  it('角色列表按编码、名称和状态筛选', async () => {
    const repository = new InMemoryRoleRepository();
    const operator = await repository.create({ code: 'operator', name: '运营人员' });
    await repository.create({ code: 'viewer', name: '查看人员' });
    await repository.update(operator.id, { isActive: false });

    const result = await repository.list(
      Object.assign(new RoleListQueryDto(), { code: 'operator', name: '运营人员', isActive: false })
    );

    expect(result.items).toMatchObject([{ id: operator.id, code: 'operator', isActive: false }]);
    expect(result.total).toBe(1);
  });

  it('用户列表按 ID、微信身份和昵称分别筛选', async () => {
    const repository = new InMemoryUserRepository();
    const user = await repository.create({ openId: 'open-1', unionId: 'union-1', nickname: '小明' });
    await repository.create({ openId: 'open-2', unionId: 'union-2', nickname: '小红' });

    const result = await repository.list(
      Object.assign(new UserListQueryDto(), { id: user.id, openId: 'open-1', unionId: 'union-1', nickname: '小明' })
    );

    expect(result.items).toMatchObject([{ id: user.id, openId: 'open-1', unionId: 'union-1', nickname: '小明' }]);
    expect(result.total).toBe(1);
  });

  it('审计日志按操作者 ID、目标 ID、操作、资源和结果筛选', async () => {
    const service = new AuditService();
    await service.record({
      actorAdminId: 'admin-1',
      action: 'admin.update',
      resourceType: 'admin',
      targetId: 'target-1'
    });
    await service.record({
      actorAdminId: 'admin-2',
      action: 'role.update',
      resourceType: 'role',
      targetId: 'target-2',
      succeeded: false
    });

    const result = await service.list(
      Object.assign(new AuditLogListQueryDto(), {
        limit: 20,
        actorAdminId: 'admin-1',
        targetId: 'target-1',
        action: 'admin.update',
        resourceType: 'admin',
        succeeded: true
      })
    );

    expect(result.items).toMatchObject([{ actorAdminId: 'admin-1', action: 'admin.update', targetId: 'target-1' }]);
    expect(result.hasMore).toBe(false);
  });
});
