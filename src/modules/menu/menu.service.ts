import { BadRequestException, Inject, Injectable, NotFoundException, type OnModuleInit } from '@nestjs/common';
import { AuditService } from '../audit/audit.service.js';
import { PermissionService } from '../permission/permission.service.js';
import { MENU_REPOSITORY } from './repositories/menu-repository.port.js';
import type { MenuRepository } from './repositories/menu-repository.port.js';
import type { MenuListItem, MenuRecord, MenuUpdateInput } from './types/menu.types.js';
import type { RegisteredMenuEntry } from './types/registered-menu.types.js';
import { menuRegistryError, validateMenuStructureMatch } from './utils/menu-registry.util.js';
import { flattenRegisteredMenus } from './utils/registered-menu.util.js';
/** 菜单目录应用服务，启动时按注册表校验并对齐数据库菜单。 */
@Injectable()
export class MenuService implements OnModuleInit {
  /** 创建当前实例。 */
  constructor(
    @Inject(MENU_REPOSITORY) private readonly repo: MenuRepository,
    @Inject(AuditService) private readonly audit: AuditService,
    @Inject(PermissionService) private readonly permissionService: PermissionService
  ) {}

  /** 注册表扁平化后的菜单定义，启动校验和补齐均以此为唯一依据。 */
  private readonly registry: RegisteredMenuEntry[] = flattenRegisteredMenus();
  /** 模块初始化时同步注册数据 */
  async onModuleInit(): Promise<void> {
    await this.validateRegistry();
    await this.synchronizeMissingMenus();
    await this.validatePersistedMenus();
  }

  /** 查询全部菜单及其权限可用状态。 */
  async list(): Promise<MenuListItem[]> {
    const items = await this.repo.list();
    return Promise.all(items.map(item => this.toListItem(item)));
  }

  /** 更新数据库作者维护的菜单展示属性。 */
  async update(actorId: string, id: string, input: MenuUpdateInput): Promise<MenuListItem> {
    const current = await this.repo.findById(id);
    if (!current) throw new NotFoundException('菜单不存在');
    if (Object.keys(input).length === 0) throw new BadRequestException('至少需要更新一个菜单展示字段');
    const item = await this.repo.update(id, input);
    await this.audit.record({
      actorAdminId: actorId,
      action: 'menu.update',
      resourceType: 'menu',
      targetId: id,
      details: { menuKey: current.menuKey, changes: input }
    });
    return this.toListItem(item);
  }

  /** 启用或停用菜单。 */
  setActive(actorId: string, id: string, isActive: boolean): Promise<MenuListItem> {
    return this.update(actorId, id, { isActive });
  }

  /** 为菜单记录补齐权限可用状态。 */
  private async toListItem(item: MenuRecord): Promise<MenuListItem> {
    return {
      ...item,
      permissionAvailable: item.permissionCode
        ? Boolean((await this.permissionService.findByCode(item.permissionCode))?.isActive)
        : true
    };
  }

  /** 校验注册表菜单标识唯一且绑定的权限已注册。 */
  private async validateRegistry(): Promise<void> {
    const keys = new Set<string>();
    for (const menu of this.registry) {
      if (keys.has(menu.menuKey))
        throw menuRegistryError(menu.menuKey, 'menuKey', menu.menuKey, '唯一', '删除重复注册');
      keys.add(menu.menuKey);
      if (menu.permissionCode) {
        const permission = await this.permissionService.findByCode(menu.permissionCode);
        if (!permission)
          throw menuRegistryError(menu.menuKey, 'permissionCode', menu.permissionCode, '已注册权限', '先注册对应权限');
      }
    }
  }

  /** 按注册表补齐数据库中缺失的菜单。 */
  private async synchronizeMissingMenus(): Promise<void> {
    for (const menu of this.registry) {
      const existing = await this.repo.findByMenuKey(menu.menuKey);
      if (existing) continue;
      await this.repo.create({
        menuKey: menu.menuKey,
        parentKey: menu.parentKey,
        title: menu.title,
        path: menu.path,
        order: menu.order,
        permissionCode: menu.permissionCode,
        isRootOnly: menu.isRootOnly,
        isActive: true
      });
    }
  }

  /** 校验数据库菜单结构和注册表一致，漂移时阻止启动。 */
  private async validatePersistedMenus(): Promise<void> {
    const items = await this.repo.list();
    const registered = new Map(this.registry.map(menu => [menu.menuKey, menu]));
    for (const item of items) {
      const definition = registered.get(item.menuKey);
      if (!definition)
        throw menuRegistryError(item.menuKey, 'menuKey', item.menuKey, '注册表中的菜单', '通过 Migration 清理未知菜单');
      if (item.parentKey !== definition.parentKey) {
        throw menuRegistryError(
          item.menuKey,
          'parentKey',
          item.parentKey,
          definition.parentKey,
          '通过 Migration 修正父级关系'
        );
      }
      validateMenuStructureMatch(item, 'path', definition.path);
      validateMenuStructureMatch(item, 'permissionCode', definition.permissionCode);
      validateMenuStructureMatch(item, 'isRootOnly', definition.isRootOnly);
    }
    for (const definition of this.registry) {
      if (!items.some(item => item.menuKey === definition.menuKey)) {
        throw menuRegistryError(definition.menuKey, 'menuKey', null, definition.menuKey, '通过 Migration 插入菜单');
      }
    }
  }
}
