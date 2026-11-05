import { Inject, Injectable, Logger, NotFoundException, type OnModuleInit } from '@nestjs/common';
import { PERMISSION_REPOSITORY } from './repositories/permission-repository.port.js';
import type { PermissionRepository } from './repositories/permission-repository.port.js';
import type { PermissionGroup, PermissionRecord } from '../authorization/types/permission.types.js';
import { buildPermissionGroups } from './utils/permission-group.util.js';
import { collectDefinitionChanges, validatePermissionRegistry } from './utils/permission-registry.util.js';
import { REGISTERED_PERMISSIONS, REGISTERED_PERMISSION_GROUPS } from './constants/registered-permissions.constant.js';
import { AuditService } from '../audit/audit.service.js';

/** 权限目录应用服务。 */
@Injectable()
export class PermissionService implements OnModuleInit {
  /** 记录启动同步对数据库权限定义的写入结果。 */
  private readonly logger = new Logger(PermissionService.name);

  /** 注册表声明的权限编码集合，用于识别注册表之外的历史权限。 */
  private readonly registeredCodes = new Set(REGISTERED_PERMISSIONS.map(definition => definition.code));

  constructor(
    @Inject(PERMISSION_REPOSITORY) private readonly repository: PermissionRepository,
    @Inject(AuditService) private readonly auditService: AuditService
  ) {}

  /** 启动时校验权限注册表，并按注册表补齐数据库权限定义。 */
  async onModuleInit(): Promise<void> {
    validatePermissionRegistry(REGISTERED_PERMISSION_GROUPS);
    await this.synchronizeRegistry();
  }

  /** 查询权限目录。 */
  listPermissions(): Promise<PermissionRecord[]> {
    return this.repository.list();
  }

  /** 查询按分类分组的权限目录。 */
  async listPermissionGroups(): Promise<PermissionGroup[]> {
    return buildPermissionGroups(await this.repository.list());
  }

  /** 查询允许绑定给普通角色的权限。 */
  async listAssignablePermissions(): Promise<PermissionRecord[]> {
    const permissions = await this.repository.list();
    return permissions.filter(permission => permission.isActive && permission.isAssignable && !permission.isProtected);
  }

  /** 查询按分类分组的可分配权限。 */
  async listAssignablePermissionGroups(): Promise<PermissionGroup[]> {
    return buildPermissionGroups(await this.listAssignablePermissions());
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

  /** 创建缺失权限并对齐代码维护字段，保留启用状态，并对注册表之外的历史权限告警。 */
  private async synchronizeRegistry(): Promise<void> {
    const persisted = new Map((await this.repository.list()).map(item => [item.code, item]));
    let createdCount = 0;
    let alignedCount = 0;
    for (const definition of REGISTERED_PERMISSIONS) {
      const existing = persisted.get(definition.code);
      if (!existing) {
        await this.repository.create({ ...definition, isActive: true });
        createdCount += 1;
        continue;
      }
      const patch = collectDefinitionChanges(existing, definition);
      if (!patch) continue;
      await this.repository.updateDefinition(existing.id, patch);
      alignedCount += 1;
    }
    if (createdCount > 0 || alignedCount > 0) {
      this.logger.log(`权限注册表同步完成: 新增 ${createdCount} 项, 对齐 ${alignedCount} 项`);
    }
    this.warnUnregisteredPermissions([...persisted.keys()]);
  }

  /**
   * 列出注册表之外的历史权限编码，只告警不阻止启动。
   *
   * @param persistedCodes - 同步前数据库中已存在的权限编码。
   */
  private warnUnregisteredPermissions(persistedCodes: string[]): void {
    const unregisteredCodes = persistedCodes.filter(code => !this.registeredCodes.has(code));
    if (unregisteredCodes.length === 0) return;
    this.logger.warn(`注册表之外的历史权限: ${unregisteredCodes.join(', ')}，启动同步不会删除，需通过 Migration 清理`);
  }
}
