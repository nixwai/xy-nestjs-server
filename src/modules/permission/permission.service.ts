import type { OnModuleInit } from '@nestjs/common';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PERMISSION_REPOSITORY } from './repositories/permission-repository.port.js';
import type { PermissionRepository } from './repositories/permission-repository.port.js';
import type { PermissionRecord, RegisteredPermission } from '../authorization/types/permission.types.js';
import { REGISTERED_PERMISSIONS } from './constants/registered-permissions.constant.js';
import { AuditService } from '../audit/audit.service.js';

/** 权限目录应用服务。 */
@Injectable()
export class PermissionService implements OnModuleInit {
  constructor(
    @Inject(PERMISSION_REPOSITORY) private readonly repository: PermissionRepository,
    @Inject(AuditService) private readonly auditService: AuditService
  ) {}

  /** 初始化代码注册的权限目录。 */
  async onModuleInit(): Promise<void> {
    await this.initializeDefaults();
  }

  /** 同步代码注册的权限。 */
  async initializeDefaults(): Promise<void> {
    for (const permission of REGISTERED_PERMISSIONS) {
      await this.repository.upsertRegistered(permission);
    }
  }

  /** 查询权限目录。 */
  listPermissions(): Promise<PermissionRecord[]> {
    return this.repository.list();
  }

  /** 查询允许绑定给普通角色的权限。 */
  async listAssignablePermissions(): Promise<PermissionRecord[]> {
    const permissions = await this.repository.list();
    return permissions.filter(permission => permission.isActive && permission.isAssignable && !permission.isProtected);
  }

  /** 查询单个权限。 */
  findById(id: string): Promise<PermissionRecord | null> {
    return this.repository.findById(id);
  }

  /** 按权限编码查询权限。 */
  findByCode(code: string): Promise<PermissionRecord | null> {
    return this.repository.findByCode(code);
  }

  /** 批量查询权限。 */
  findByIds(ids: string[]): Promise<PermissionRecord[]> {
    return this.repository.findByIds(ids);
  }

  /** 写入代码注册权限。 */
  upsertRegistered(input: RegisteredPermission): Promise<PermissionRecord> {
    return this.repository.upsertRegistered(input);
  }

  /** 修改权限启用状态。 */
  async setActive(actorId: string, id: string, isActive: boolean): Promise<PermissionRecord> {
    const item = await this.repository.findById(id);
    if (!item) {
      throw new NotFoundException('权限不存在');
    }
    const updated = await this.repository.setActive(id, isActive);
    await this.auditService.record({
      actorAdminId: actorId,
      action: isActive ? 'permission.enable' : 'permission.disable',
      resourceType: 'permission',
      targetId: id
    });
    return updated;
  }
}
