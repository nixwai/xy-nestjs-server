import { BadRequestException, ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { omitUndefined, validatePassword } from '#/common/utils/index.js';
import { hashPassword, verifyPassword } from '../auth/utils/password.util.js';
import type { AdminRepository, AdminTransactionRunner } from './repositories/admin-repository.port.js';
import { ADMIN_REPOSITORY, ADMIN_TRANSACTION_RUNNER } from './repositories/admin-repository.port.js';
import type { AdminCreateInput, AdminRecord, AdminPublicRecord, AdminUpdateInput } from './types/admin.types.js';
import { RoleService } from '../role/role.service.js';
import { AuditService } from '../audit/audit.service.js';
import type { AdminCreateRequestDto, AdminUpdateRequestDto } from './dto/index.js';
import { AdminListQueryDto } from './dto/index.js';
import type { PageResult } from '#/common/types/index.js';

/** 管理员账户应用服务。 */
@Injectable()
export class AdminService {
  constructor(
    @Inject(ADMIN_REPOSITORY) private readonly repository: AdminRepository,
    @Inject(RoleService) private readonly roleService: RoleService,
    @Inject(AuditService) private readonly auditService: AuditService,
    @Inject(ADMIN_TRANSACTION_RUNNER)
    private readonly transactionRunner: AdminTransactionRunner
  ) {}

  /** 查询管理员。 */
  findById(id: string): Promise<AdminRecord | null> {
    return this.repository.findById(id);
  }

  /** 按用户名查询管理员。 */
  findByUsername(username: string): Promise<AdminRecord | null> {
    return this.repository.findByUsername(username);
  }

  /** 查询管理员列表。 */
  async listAdmins(query: AdminListQueryDto = new AdminListQueryDto()): Promise<PageResult<AdminPublicRecord>> {
    const result = await this.repository.list(query);
    const roleIds = await this.repository.listRoleIdsByAdminIds(result.items.map(item => item.id));
    return {
      ...result,
      items: result.items.map(item => this.toPublic(item, roleIds.get(item.id) ?? []))
    };
  }

  /** 查询当前管理员。 */
  async getMe(id: string): Promise<AdminPublicRecord> {
    const item = await this.repository.findById(id);
    if (!item) {
      throw new NotFoundException('管理员不存在');
    }
    return this.toPublic(item, await this.repository.listRoleIds(id));
  }

  /** 创建管理员。 */
  async createAdmin(actorId: string, body: AdminCreateRequestDto): Promise<AdminPublicRecord> {
    if (body.isRoot && !body.currentPassword) {
      throw new BadRequestException('创建根管理员必须验证当前密码');
    }
    if (body.isRoot && !(await this.verifyPassword(actorId, body.currentPassword as string)))
      throw new ForbiddenException('当前密码错误');
    validatePassword(body.password);
    const password = await hashPassword(body.password);
    const role = body.isRoot ? null : await this.roleService.findByCode('operator');
    const item = await this.transactionRunner.run(async repository => {
      const created = await repository.create({
        username: body.username,
        passwordHash: password.hash,
        passwordSalt: password.salt,
        isRoot: body.isRoot
      });
      if (role) {
        await repository.bindRole(created.id, role.id);
      }
      return created;
    });
    await this.auditService.record({
      actorAdminId: actorId,
      action: 'admin.create',
      resourceType: 'admin',
      targetId: item.id,
      details: { isRoot: item.isRoot }
    });
    return this.toPublic(item, await this.repository.listRoleIds(item.id));
  }

  /** 更新管理员。 */
  async updateAdmin(actorId: string, body: AdminUpdateRequestDto): Promise<AdminPublicRecord> {
    const target = await this.repository.findById(body.id);
    if (!target) {
      throw new NotFoundException('管理员不存在');
    }
    const needsPassword = target.isRoot || body.isRoot === true || Boolean(body.password);
    if (needsPassword && (!body.currentPassword || !(await this.verifyPassword(actorId, body.currentPassword))))
      throw new ForbiddenException('当前密码错误');
    if (
      target.isRoot &&
      target.isActive &&
      (body.isRoot === false || body.isActive === false) &&
      (await this.repository.countActiveRoots()) <= 1
    )
      throw new ForbiddenException('系统必须至少保留一名启用的根管理员');
    const input: AdminUpdateInput = {
      username: body.username,
      isActive: body.isActive,
      isRoot: body.isRoot
    };
    if (body.password) {
      validatePassword(body.password);
      const password = await hashPassword(body.password);
      input.passwordHash = password.hash;
      input.passwordSalt = password.salt;
    }
    const item = await this.repository.update(body.id, omitUndefined(input));
    await this.auditService.record({
      actorAdminId: actorId,
      action: 'admin.update',
      resourceType: 'admin',
      targetId: body.id,
      details: {
        passwordChanged: Boolean(body.password),
        isRoot: item.isRoot
      }
    });
    return this.toPublic(item, await this.repository.listRoleIds(item.id));
  }

  /** 重置管理员密码。 */
  async resetAdminPassword(
    actorId: string,
    id: string,
    passwordValue: string,
    currentPassword: string
  ): Promise<AdminPublicRecord> {
    const target = await this.repository.findById(id);
    if (!target) throw new NotFoundException('管理员不存在');
    if (!(await this.verifyPassword(actorId, currentPassword))) throw new ForbiddenException('当前密码错误');
    validatePassword(passwordValue);
    const password = await hashPassword(passwordValue);
    const item = await this.repository.update(id, {
      passwordHash: password.hash,
      passwordSalt: password.salt
    });
    await this.auditService.record({
      actorAdminId: actorId,
      action: 'admin.reset-password',
      resourceType: 'admin',
      targetId: id
    });
    return this.toPublic(item, await this.repository.listRoleIds(item.id));
  }

  /** 删除管理员。 */
  async softDeleteAdmin(actorId: string, id: string, currentPassword: string): Promise<null> {
    const target = await this.repository.findById(id);
    if (!target) {
      throw new NotFoundException('管理员不存在');
    }
    if (!(await this.verifyPassword(actorId, currentPassword))) {
      throw new ForbiddenException('当前密码错误');
    }
    if (target.isRoot && target.isActive && (await this.repository.countActiveRoots()) <= 1)
      throw new ForbiddenException('系统必须至少保留一名启用的根管理员');
    await this.transactionRunner.run(repository => repository.softDelete(id));
    await this.auditService.record({
      actorAdminId: actorId,
      action: 'admin.soft-delete',
      resourceType: 'admin',
      targetId: id
    });
    return null;
  }

  /** 绑定角色。 */
  async bindRole(actorId: string, adminId: string, roleId: string): Promise<null> {
    if (!(await this.repository.findById(adminId))) {
      throw new NotFoundException('管理员不存在');
    }
    if (!(await this.roleService.findById(roleId))) {
      throw new NotFoundException('角色不存在');
    }
    await this.repository.bindRole(adminId, roleId);
    await this.auditService.record({
      actorAdminId: actorId,
      action: 'admin.role-bind',
      resourceType: 'admin',
      targetId: adminId,
      details: { roleId }
    });
    return null;
  }

  /** 解绑角色。 */
  async unbindRole(actorId: string, adminId: string, roleId: string): Promise<null> {
    if (!(await this.repository.findById(adminId))) {
      throw new NotFoundException('管理员不存在');
    }
    if (!(await this.roleService.findById(roleId))) {
      throw new NotFoundException('角色不存在');
    }
    await this.repository.unbindRole(adminId, roleId);
    await this.auditService.record({
      actorAdminId: actorId,
      action: 'admin.role-unbind',
      resourceType: 'admin',
      targetId: adminId,
      details: { roleId }
    });
    return null;
  }

  /** 创建初始化根管理员。 */
  createInitialAdmin(input: AdminCreateInput): Promise<AdminRecord> {
    return this.repository.create({ ...input, isRoot: true });
  }

  /** 校验管理员密码。 */
  async verifyPassword(adminId: string, password: string): Promise<boolean> {
    const item = await this.repository.findById(adminId);
    return Boolean(item && (await verifyPassword(password, item.passwordHash, item.passwordSalt)));
  }

  /** 查询管理员角色 ID。 */
  listAdminRoleIds(adminId: string): Promise<string[]> {
    return this.repository.listRoleIds(adminId);
  }

  /** 批量查询管理员角色 ID。 */
  listAdminRoleIdsByAdminIds(adminIds: string[]): Promise<Map<string, string[]>> {
    return this.repository.listRoleIdsByAdminIds(adminIds);
  }

  private toPublic(item: AdminRecord, roleIds: string[]): AdminPublicRecord {
    return {
      id: item.id,
      username: item.username,
      isActive: item.isActive,
      isRoot: item.isRoot,
      roleIds: [...roleIds],
      createdAt: item.createdAt,
      updatedAt: item.updatedAt
    };
  }
}
