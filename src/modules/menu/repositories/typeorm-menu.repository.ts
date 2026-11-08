import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import { DomainNotFoundError } from '#/common/errors/index.js';
import { MenuEntity } from '../entities/menu.entity.js';
import type { MenuCreateInput, MenuRecord, MenuUpdateInput } from '../types/menu.types.js';
import type { MenuRepository } from './menu-repository.port.js';
/** 定义 TypeOrmMenuRepository。 */
@Injectable()
export class TypeOrmMenuRepository implements MenuRepository {
  /** 创建当前实例。 */
  constructor(@InjectRepository(MenuEntity) private readonly menus: Repository<MenuEntity>) {}

  /** 查询记录列表 */
  async list() {
    return (await this.menus.find({ order: { order: 'ASC', id: 'ASC' } })).map(item => this.toRecord(item));
  }

  /** 按标识查询记录 */
  async findById(id: string) {
    const item = await this.menus.findOne({ where: { id } });
    return item ? this.toRecord(item) : null;
  }

  /** 按菜单标识查询记录 */
  async findByMenuKey(menuKey: string) {
    const item = await this.menus.findOne({ where: { menuKey } });
    return item ? this.toRecord(item) : null;
  }

  /** 创建记录 */
  async create(input: MenuCreateInput) {
    return this.toRecord(await this.menus.save(this.menus.create(input)));
  }

  /** 更新记录 */
  async update(id: string, input: MenuUpdateInput) {
    const item = await this.menus.findOne({ where: { id } });
    if (!item) throw new DomainNotFoundError('菜单');
    this.menus.merge(item, input);
    return this.toRecord(await this.menus.save(item));
  }

  /** 将实体转换为领域记录 */
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
