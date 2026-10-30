import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import {
  DomainConflictError,
  DomainNotFoundError,
} from '../../../common/errors/index.js';
import { RolePermissionEntity } from '../entities/role-permission.entity.js';
import { AdminRoleEntity } from '../../admin/entities/admin-role.entity.js';
import { RoleEntity } from '../entities/role.entity.js';
import type { RoleRecord } from '../types/role.types.js';
import type { RoleRepository } from './role-repository.port.js';

/** 使用 TypeORM 保存角色及其权限关系。 */
@Injectable()
export class TypeOrmRoleRepository implements RoleRepository {
  constructor(
    @InjectRepository(RoleEntity)
    private readonly roles: Repository<RoleEntity>,
    @InjectRepository(RolePermissionEntity)
    private readonly rolePermissions: Repository<RolePermissionEntity>,
    @InjectRepository(AdminRoleEntity)
    private readonly adminRoles: Repository<AdminRoleEntity>,
  ) {}

  async list(): Promise<RoleRecord[]> {
    return this.toRecords(await this.roles.find());
  }

  async findById(id: string): Promise<RoleRecord | null> {
    const item = await this.roles.findOne({ where: { id } });
    return item ? (await this.toRecords([item]))[0] : null;
  }

  async findByIds(ids: string[]): Promise<RoleRecord[]> {
    if (ids.length === 0) {
      return [];
    }
    const items = await this.roles
      .createQueryBuilder('role')
      .where('role.id IN (:...ids)', { ids })
      .getMany();
    const records = new Map(
      (await this.toRecords(items)).map((item) => [item.id, item]),
    );
    return ids.flatMap((id) => {
      const item = records.get(id);
      return item ? [item] : [];
    });
  }

  async findByCode(code: string): Promise<RoleRecord | null> {
    const item = await this.roles.findOne({ where: { code } });
    return item ? (await this.toRecords([item]))[0] : null;
  }

  async create(input: {
    code: string;
    name: string;
    description?: string;
  }): Promise<RoleRecord> {
    try {
      const item = await this.roles.save(
        this.roles.create({
          ...input,
          description: input.description ?? null,
          isActive: true,
          deletedAt: null,
        }),
      );
      return this.toRecord(item);
    } catch (error: unknown) {
      if (this.isDuplicate(error)) {
        throw new DomainConflictError('角色编码');
      }
      throw error;
    }
  }

  async update(
    id: string,
    input: Partial<Pick<RoleRecord, 'name' | 'description' | 'isActive'>>,
  ): Promise<RoleRecord> {
    const item = await this.findEntityOrThrow(id);
    this.roles.merge(item, input);
    return this.toRecord(await this.roles.save(item));
  }

  async softDelete(id: string): Promise<void> {
    await this.roles.manager.transaction(async (manager) => {
      const roles = manager.getRepository(RoleEntity);
      const rolePermissions = manager.getRepository(RolePermissionEntity);
      const adminRoles = manager.getRepository(AdminRoleEntity);
      const item = await roles.findOne({ where: { id } });
      if (!item) {
        throw new DomainNotFoundError('角色');
      }
      await roles.softRemove(item);
      await rolePermissions.delete({ roleId: id });
      await adminRoles.delete({ roleId: id });
    });
  }

  async bindPermission(roleId: string, permissionId: string): Promise<void> {
    await this.findEntityOrThrow(roleId);
    if (
      await this.rolePermissions.findOne({ where: { roleId, permissionId } })
    ) {
      throw new DomainConflictError('角色权限关系');
    }
    try {
      await this.rolePermissions.save(
        this.rolePermissions.create({ roleId, permissionId }),
      );
    } catch (error: unknown) {
      if (this.isDuplicate(error)) {
        throw new DomainConflictError('角色权限关系');
      }
      throw error;
    }
  }

  async unbindPermission(roleId: string, permissionId: string): Promise<void> {
    await this.findEntityOrThrow(roleId);
    await this.rolePermissions.delete({ roleId, permissionId });
  }

  private async findEntityOrThrow(id: string): Promise<RoleEntity> {
    const item = await this.roles.findOne({ where: { id } });
    if (!item) {
      throw new DomainNotFoundError('角色');
    }
    return item;
  }

  private async toRecords(items: RoleEntity[]): Promise<RoleRecord[]> {
    if (items.length === 0) {
      return [];
    }
    const relations = await this.rolePermissions.find({
      where: items.map(({ id }) => ({ roleId: id })),
    });
    const permissionIds = new Map<string, string[]>();
    for (const relation of relations) {
      const current = permissionIds.get(String(relation.roleId)) ?? [];
      permissionIds.set(String(relation.roleId), [
        ...current,
        String(relation.permissionId),
      ]);
    }
    return items.map((item) =>
      this.toRecord(item, permissionIds.get(String(item.id)) ?? []),
    );
  }

  private toRecord(item: RoleEntity, permissionIds: string[] = []): RoleRecord {
    return {
      id: String(item.id),
      code: item.code,
      name: item.name,
      description: item.description,
      isActive: item.isActive,
      deletedAt: item.deletedAt,
      permissionIds: [...permissionIds],
    };
  }

  private isDuplicate(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'ER_DUP_ENTRY'
    );
  }
}
