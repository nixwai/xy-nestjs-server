import type { OnModuleInit } from '@nestjs/common';
import { Inject, Injectable } from '@nestjs/common';
import { AuditService } from '../audit/audit.service.js';
import { MENU_REPOSITORY } from './repositories/menu-repository.port.js';
import type { MenuRepository } from './repositories/menu-repository.port.js';
import type { MenuRecord } from './types/menu.types.js';

const DEFAULT_MENUS = [
  {
    parentId: null,
    title: '工作台',
    path: '/home',
    icon: 'carbon:dashboard',
    order: 1,
    permissionCode: null,
    isActive: true
  },
  {
    parentId: null,
    title: '管理员管理',
    path: '/admin',
    icon: 'carbon:user-admin',
    order: 2,
    permissionCode: 'admin:GET',
    isActive: true
  },
  {
    parentId: null,
    title: '权限管理',
    path: '/permission',
    icon: 'carbon:security',
    order: 3,
    permissionCode: 'role:GET',
    isActive: true
  },
  {
    parentId: null,
    title: '菜单管理',
    path: '/menu',
    icon: 'carbon:menu',
    order: 4,
    permissionCode: 'menu:GET',
    isActive: true
  }
] as const;
@Injectable()
export class MenuService implements OnModuleInit {
  constructor(
    @Inject(MENU_REPOSITORY) private readonly repo: MenuRepository,
    @Inject(AuditService) private readonly audit: AuditService
  ) {}
  async onModuleInit() {
    try {
      for (const menu of DEFAULT_MENUS) await this.repo.upsertSeed(menu);
    } catch (error) {
      if (!isMissingMenuTable(error)) throw error;
    }
  }
  list() {
    return this.repo.list();
  }
  async create(actorId: string, input: Omit<MenuRecord, 'id' | 'deletedAt'>) {
    const item = await this.repo.create(input);
    await this.audit.record({ actorAdminId: actorId, action: 'menu.create', resourceType: 'menu', targetId: item.id });
    return item;
  }
  async update(
    actorId: string,
    id: string,
    input: Partial<Pick<MenuRecord, 'parentId' | 'title' | 'path' | 'icon' | 'order' | 'permissionCode' | 'isActive'>>
  ) {
    const item = await this.repo.update(id, input);
    await this.audit.record({ actorAdminId: actorId, action: 'menu.update', resourceType: 'menu', targetId: id });
    return item;
  }
  async softDelete(actorId: string, id: string) {
    await this.repo.softDelete(id);
    await this.audit.record({ actorAdminId: actorId, action: 'menu.soft-delete', resourceType: 'menu', targetId: id });
  }
  async setActive(actorId: string, id: string, isActive: boolean) {
    return this.update(actorId, id, { isActive });
  }
}

function isMissingMenuTable(error: unknown) {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 'ER_NO_SUCH_TABLE';
}
