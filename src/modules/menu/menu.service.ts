import { BadRequestException, Inject, Injectable, NotFoundException, type OnModuleInit } from '@nestjs/common';
import { AuditService } from '../audit/audit.service.js';
import { PermissionService } from '../permission/permission.service.js';
import { MENU_REPOSITORY } from './repositories/menu-repository.port.js';
import type { MenuRepository } from './repositories/menu-repository.port.js';
import { flattenRegisteredMenus } from './constants/registered-menus.constant.js';
import type { MenuRecord } from './types/menu.types.js';

@Injectable()
export class MenuService implements OnModuleInit {
  constructor(
    @Inject(MENU_REPOSITORY) private readonly repo: MenuRepository,
    @Inject(AuditService) private readonly audit: AuditService,
    @Inject(PermissionService) private readonly permissionService: PermissionService
  ) {}

  private readonly registry = flattenRegisteredMenus();

  async onModuleInit(): Promise<void> {
    await this.validateRegistry();
    await this.synchronizeMissingMenus();
    await this.validatePersistedMenus();
  }

  async list() {
    const items = await this.repo.list();
    const permissionStates = await Promise.all(
      items.map(async item => ({
        item,
        permissionAvailable: item.permissionCode
          ? Boolean((await this.permissionService.findByCode(item.permissionCode))?.isActive)
          : true
      }))
    );
    return permissionStates.map(({ item, permissionAvailable }) => ({ ...item, permissionAvailable }));
  }

  async update(actorId: string, id: string, input: Pick<Partial<MenuRecord>, 'title' | 'order' | 'isActive'>) {
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

  async setActive(actorId: string, id: string, isActive: boolean) {
    return this.update(actorId, id, { isActive });
  }

  private async toListItem(item: MenuRecord) {
    return {
      ...item,
      permissionAvailable: item.permissionCode
        ? Boolean((await this.permissionService.findByCode(item.permissionCode))?.isActive)
        : true
    };
  }

  private async validateRegistry(): Promise<void> {
    const keys = new Set<string>();
    for (const menu of this.registry) {
      if (keys.has(menu.menuKey)) throw registryError(menu.menuKey, 'menuKey', menu.menuKey, '唯一', '删除重复注册');
      keys.add(menu.menuKey);
      if (menu.permissionCode) {
        const permission = await this.permissionService.findByCode(menu.permissionCode);
        if (!permission)
          throw registryError(menu.menuKey, 'permissionCode', menu.permissionCode, '已注册权限', '先注册对应权限');
      }
    }
  }

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

  private async validatePersistedMenus(): Promise<void> {
    const items = await this.repo.list();
    const registered = new Map(this.registry.map(menu => [menu.menuKey, menu]));
    for (const item of items) {
      const definition = registered.get(item.menuKey);
      if (!definition)
        throw registryError(item.menuKey, 'menuKey', item.menuKey, '注册表中的菜单', '通过 Migration 清理未知菜单');
      if (item.parentKey !== definition.parentKey) {
        throw registryError(
          item.menuKey,
          'parentKey',
          item.parentKey,
          definition.parentKey,
          '通过 Migration 修正父级关系'
        );
      }
      validateMatch(item, 'path', definition.path);
      validateMatch(item, 'permissionCode', definition.permissionCode);
      validateMatch(item, 'isRootOnly', definition.isRootOnly);
    }
    for (const definition of this.registry) {
      if (!items.some(item => item.menuKey === definition.menuKey)) {
        throw registryError(definition.menuKey, 'menuKey', null, definition.menuKey, '通过 Migration 插入菜单');
      }
    }
  }
}

function validateMatch(
  item: MenuRecord,
  field: keyof Pick<MenuRecord, 'path' | 'permissionCode' | 'isRootOnly'>,
  expected: unknown
) {
  if (item[field] !== expected)
    throw registryError(item.menuKey, field, item[field], expected, '通过 Migration 修正结构字段');
}

function registryError(menuKey: string, field: string, actual: unknown, expected: unknown, resolution: string) {
  return new BadRequestException({
    message: `菜单注册校验失败: ${menuKey}.${field}`,
    data: { menuKey, field, actual, expected, resolution }
  });
}
