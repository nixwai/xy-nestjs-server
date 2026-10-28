import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { PermissionResource } from '../../common/enums/index.js';
import { PERMISSION_REPOSITORY } from './repositories/permission-repository.port.js';
import type { PermissionRepository } from './repositories/permission-repository.port.js';
import type {
  PermissionRecord,
  RegisteredPermission,
} from '../../common/types/permission.types.js';
import { REGISTERED_PERMISSIONS } from './permission-registry.js';
import { AuditService } from '../audit/audit.service.js';

/** 权限目录应用服务。 */
@Injectable()
export class PermissionService implements OnModuleInit {
  constructor(
    @Inject(PERMISSION_REPOSITORY)
    private readonly repository: PermissionRepository,
    private readonly auditService: AuditService,
  ) {}
  /** 初始化代码注册的权限目录。 */
  async onModuleInit(): Promise<void> {
    await this.initializeDefaults();
  }
  /** 同步代码注册的权限。 */
  async initializeDefaults(): Promise<void> {
    for (const permission of REGISTERED_PERMISSIONS)
      await this.repository.upsertRegistered(permission);
  }
  /** 查询权限目录。 */
  async listPermissions(): Promise<PermissionRecord[]> {
    return this.repository.list();
  }
  /** 查询单个权限。 */
  async findById(id: string): Promise<PermissionRecord | null> {
    return this.repository.findById(id);
  }
  /** 批量查询权限。 */
  findByIds(ids: string[]): Promise<PermissionRecord[]> {
    return this.repository.findByIds(ids);
  }
  /** 写入代码注册权限。 */
  async upsertRegistered(
    input: RegisteredPermission,
  ): Promise<PermissionRecord> {
    return this.repository.upsertRegistered(input);
  }
  /** 修改权限启用状态。 */
  async setActive(
    actorId: string,
    id: string,
    isActive: boolean,
  ): Promise<PermissionRecord> {
    const item = await this.repository.setActive(id, isActive);
    await this.auditService.record({
      actorAdminId: actorId,
      action: isActive ? 'permission.enable' : 'permission.disable',
      resourceType: PermissionResource.PERMISSION,
      targetId: id,
    });
    return item;
  }
}
