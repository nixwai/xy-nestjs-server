import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ROLE_REPOSITORY } from './repositories/role-repository.port.js';
import type { RoleRepository } from './repositories/role-repository.port.js';
import { PermissionService } from '../permission/permission.service.js';
import { AuditService } from '../audit/audit.service.js';
import { PageQueryDto } from '#/common/dto/index.js';
import type { PageResult } from '#/common/types/index.js';
import type { RoleCreateInput, RoleRecord, RoleUpdateInput } from './types/role.types.js';
/** 角色及角色授权关系应用服务。 */
@Injectable()
export class RoleService {
  /** 创建当前实例。 */
  constructor(
    @Inject(ROLE_REPOSITORY) private readonly repository: RoleRepository,
    @Inject(PermissionService) private readonly permissionService: PermissionService,
    @Inject(AuditService) private readonly auditService: AuditService
  ) {}

  /** 查询角色。 */
  listRoles(query: PageQueryDto = new PageQueryDto()): Promise<PageResult<RoleRecord>> {
    return this.repository.list(query);
  }

  /** 查询角色。 */
  findById(id: string): Promise<RoleRecord | null> {
    return this.repository.findById(id);
  }

  /** 批量查询角色。 */
  findByIds(ids: string[]): Promise<RoleRecord[]> {
    return this.repository.findByIds(ids);
  }

  /** 查询角色编码。 */
  findByCode(code: string): Promise<RoleRecord | null> {
    return this.repository.findByCode(code);
  }

  /** 创建角色。 */
  async createRole(actorId: string, input: RoleCreateInput): Promise<RoleRecord> {
    const item = await this.repository.create(input);
    await this.auditService.record({
      actorAdminId: actorId,
      action: 'role.create',
      resourceType: 'role',
      targetId: item.id,
      details: { code: item.code }
    });
    return item;
  }

  /** 更新角色。 */
  async updateRole(actorId: string, id: string, input: RoleUpdateInput): Promise<RoleRecord> {
    const item = await this.repository.update(id, input);
    await this.auditService.record({
      actorAdminId: actorId,
      action: 'role.update',
      resourceType: 'role',
      targetId: id,
      details: { isActive: item.isActive }
    });
    return item;
  }

  /** 删除角色。 */
  async softDeleteRole(actorId: string, id: string): Promise<void> {
    await this.repository.softDelete(id);
    await this.auditService.record({
      actorAdminId: actorId,
      action: 'role.soft-delete',
      resourceType: 'role',
      targetId: id
    });
  }

  /** 绑定权限。 */
  async bindPermission(actorId: string, roleId: string, permissionId: string): Promise<void> {
    if (!(await this.findById(roleId))) {
      throw new NotFoundException('角色不存在');
    }
    const permission = await this.permissionService.findById(permissionId);
    if (!permission) {
      throw new NotFoundException('权限不存在');
    }
    if (!permission.isActive || !permission.isAssignable || permission.isProtected) {
      throw new ForbiddenException('该权限不可绑定给普通角色');
    }
    await this.repository.bindPermission(roleId, permissionId);
    await this.auditService.record({
      actorAdminId: actorId,
      action: 'role.permission-bind',
      resourceType: 'role',
      targetId: roleId,
      details: { permissionId }
    });
  }

  /** 解绑权限。 */
  async unbindPermission(actorId: string, roleId: string, permissionId: string): Promise<void> {
    if (!(await this.findById(roleId))) {
      throw new NotFoundException('角色不存在');
    }
    const permission = await this.permissionService.findById(permissionId);
    if (!permission) {
      throw new NotFoundException('权限不存在');
    }
    await this.repository.unbindPermission(roleId, permissionId);
    await this.auditService.record({
      actorAdminId: actorId,
      action: 'role.permission-unbind',
      resourceType: 'role',
      targetId: roleId,
      details: { permissionId }
    });
  }
}
