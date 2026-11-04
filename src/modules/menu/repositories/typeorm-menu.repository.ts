import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import { DomainNotFoundError } from '#/common/errors/index.js';
import { MenuEntity } from '../entities/menu.entity.js';
import type { MenuRecord } from '../types/menu.types.js';
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
  async create(input: Omit<MenuRecord, 'id' | 'deletedAt'>) {
    return this.toRecord(await this.menus.save(this.menus.create({ ...input, isRootOnly: input.isRootOnly ?? false })));
  }
  async update(
    id: string,
    input: Partial<
      Pick<MenuRecord, 'parentId' | 'title' | 'path' | 'icon' | 'order' | 'permissionCode' | 'isRootOnly' | 'isActive'>
    >
  ) {
    const item = await this.menus.findOne({ where: { id } });
    if (!item) throw new DomainNotFoundError('菜单');
    this.menus.merge(item, input);
    return this.toRecord(await this.menus.save(item));
  }
  async softDelete(id: string) {
    const item = await this.menus.findOne({ where: { id } });
    if (!item) throw new DomainNotFoundError('菜单');
    await this.menus.softRemove(item);
  }
  async upsertSeed(input: Omit<MenuRecord, 'id' | 'deletedAt'>) {
    const found = await this.menus.findOne({ where: { path: input.path } });
    const item = found ? this.menus.merge(found, input) : this.menus.create(input);
    return this.toRecord(await this.menus.save(item));
  }
  private toRecord(item: MenuEntity): MenuRecord {
    return {
      id: String(item.id),
      parentId: item.parentId,
      title: item.title,
      path: item.path,
      icon: item.icon,
      order: item.order,
      permissionCode: item.permissionCode,
      isRootOnly: item.isRootOnly,
      isActive: item.isActive,
      deletedAt: item.deletedAt
    };
  }
}
