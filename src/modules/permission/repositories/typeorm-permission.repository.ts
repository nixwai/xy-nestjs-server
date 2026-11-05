import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import { DomainNotFoundError } from '#/common/errors/index.js';
import { PermissionEntity } from '../entities/permission.entity.js';
import type { PermissionRecord } from '#/modules/authorization/types/permission.types.js';
import type { PermissionRepository } from './permission-repository.port.js';

/** 使用 TypeORM 保存动态权限目录。 */
@Injectable()
export class TypeOrmPermissionRepository implements PermissionRepository {
  constructor(@InjectRepository(PermissionEntity) private readonly permissions: Repository<PermissionEntity>) {}

  async list(): Promise<PermissionRecord[]> {
    return (await this.permissions.find({ order: { category: 'ASC', code: 'ASC', id: 'ASC' } })).map(item =>
      this.toRecord(item)
    );
  }

  async findById(id: string): Promise<PermissionRecord | null> {
    const item = await this.permissions.findOne({ where: { id } });
    return item ? this.toRecord(item) : null;
  }

  async findByIds(ids: string[]): Promise<PermissionRecord[]> {
    if (ids.length === 0) return [];
    const items = await this.permissions
      .createQueryBuilder('permission')
      .where('permission.id IN (:...ids)', { ids })
      .getMany();
    const records = new Map(items.map(item => [String(item.id), this.toRecord(item)]));
    return ids.flatMap(id => {
      const item = records.get(id);
      return item ? [item] : [];
    });
  }

  async findByCode(code: string): Promise<PermissionRecord | null> {
    const item = await this.permissions.findOne({ where: { code } });
    return item ? this.toRecord(item) : null;
  }

  async setActive(id: string, isActive: boolean): Promise<PermissionRecord> {
    const item = await this.permissions.findOne({ where: { id } });
    if (!item) throw new DomainNotFoundError('权限');
    item.isActive = isActive;
    return this.toRecord(await this.permissions.save(item));
  }

  private toRecord(item: PermissionEntity): PermissionRecord {
    return {
      id: String(item.id),
      code: item.code,
      name: item.name,
      description: item.description,
      category: item.category,
      isAssignable: item.isAssignable,
      isProtected: item.isProtected,
      isActive: item.isActive
    };
  }
}
