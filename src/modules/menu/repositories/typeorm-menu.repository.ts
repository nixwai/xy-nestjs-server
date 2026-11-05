import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import { DomainNotFoundError } from '#/common/errors/index.js';
import { MenuEntity } from '../entities/menu.entity.js';
import type { MenuCreateInput, MenuRecord, MenuUpdateInput } from '../types/menu.types.js';
import type { MenuRepository } from './menu-repository.port.js';

@Injectable()
export class TypeOrmMenuRepository implements MenuRepository {
  constructor(@InjectRepository(MenuEntity) private readonly menus: Repository<MenuEntity>) {}

  async list() {
    return (await this.menus.find({ order: { order: 'ASC', id: 'ASC' } })).map(item => this.toRecord(item));
  }

  async findById(id: string) {
    const item = await this.menus.findOne({ where: { id } });
    return item ? this.toRecord(item) : null;
  }

  async findByMenuKey(menuKey: string) {
    const item = await this.menus.findOne({ where: { menuKey } });
    return item ? this.toRecord(item) : null;
  }

  async create(input: MenuCreateInput) {
    return this.toRecord(await this.menus.save(this.menus.create(input)));
  }

  async update(id: string, input: MenuUpdateInput) {
    const item = await this.menus.findOne({ where: { id } });
    if (!item) throw new DomainNotFoundError('菜单');
    this.menus.merge(item, input);
    return this.toRecord(await this.menus.save(item));
  }

  private toRecord(item: MenuEntity): MenuRecord {
    return {
      id: String(item.id),
      menuKey: item.menuKey,
      parentKey: item.parentKey,
      title: item.title,
      path: item.path,
      order: item.order,
      permissionCode: item.permissionCode,
      isRootOnly: item.isRootOnly,
      isActive: item.isActive
    };
  }
}
