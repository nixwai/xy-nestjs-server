import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull } from 'typeorm';
import type { Repository } from 'typeorm';
import {
  DomainConflictError,
  DomainNotFoundError,
} from '../../../common/errors/index.js';
import { AdminEntity } from '../entities/admin.entity.js';
import { AdminRoleAssignmentEntity } from '../entities/admin-role-assignment.entity.js';
import { AdminSessionEntity } from '../entities/admin-session.entity.js';
import type {
  AdminCreateInput,
  AdminRepository,
  AdminUpdateInput,
} from './admin-repository.port.js';
import type { AdminRecord } from '../types/admin.types.js';

/** 使用 TypeORM 保存管理员账户和角色关系。 */
@Injectable()
export class TypeOrmAdminRepository implements AdminRepository {
  constructor(
    @InjectRepository(AdminEntity)
    private readonly admins: Repository<AdminEntity>,
    @InjectRepository(AdminRoleAssignmentEntity)
    private readonly adminRoles: Repository<AdminRoleAssignmentEntity>,
    @InjectRepository(AdminSessionEntity)
    private readonly adminSessions: Repository<AdminSessionEntity>,
  ) {}

  async findByUsername(username: string): Promise<AdminRecord | null> {
    const item = await this.admins.findOne({
      where: { username },
    });
    return item ? this.toRecord(item) : null;
  }

  async findById(id: string): Promise<AdminRecord | null> {
    const item = await this.admins.findOne({
      where: { id },
    });
    return item ? this.toRecord(item) : null;
  }

  async list(): Promise<AdminRecord[]> {
    const items = await this.admins.find();
    return items.map((item) => this.toRecord(item));
  }

  async create(input: AdminCreateInput): Promise<AdminRecord> {
    try {
      const item = await this.admins.save(
        this.admins.create({
          ...input,
          isActive: true,
          isSuperAdmin: input.isSuperAdmin ?? false,
          deletedAt: null,
        }),
      );
      return this.toRecord(item);
    } catch (error: unknown) {
      if (this.isDuplicate(error)) {
        throw new DomainConflictError('管理员用户名');
      }
      throw error;
    }
  }

  async update(id: string, input: AdminUpdateInput): Promise<AdminRecord> {
    const item = await this.findEntityOrThrow(id);
    this.admins.merge(item, input);
    try {
      return this.toRecord(await this.admins.save(item));
    } catch (error: unknown) {
      if (this.isDuplicate(error)) {
        throw new DomainConflictError('管理员用户名');
      }
      throw error;
    }
  }

  async softDelete(id: string): Promise<void> {
    const item = await this.findEntityOrThrow(id);
    const deletedAt = new Date();
    await this.admins.softRemove(item);
    await this.adminRoles.delete({ adminId: id });
    await this.adminSessions.update(
      { adminId: id, revokedAt: IsNull() },
      { revokedAt: deletedAt, lastUsedAt: deletedAt },
    );
  }

  async countActiveSuperAdmins(): Promise<number> {
    return this.admins.count({
      where: { isActive: true, isSuperAdmin: true },
    });
  }

  async listRoleIds(adminId: string): Promise<string[]> {
    await this.findEntityOrThrow(adminId);
    const items = await this.adminRoles.find({ where: { adminId } });
    return items.map((item) => String(item.roleId));
  }

  async listRoleIdsByAdminIds(
    adminIds: string[],
  ): Promise<Map<string, string[]>> {
    const result = new Map<string, string[]>(adminIds.map((id) => [id, []]));
    if (adminIds.length === 0) {
      return result;
    }
    const items = await this.adminRoles
      .createQueryBuilder('adminRole')
      .where('adminRole.adminId IN (:...adminIds)', { adminIds })
      .getMany();
    for (const item of items) {
      const roleIds = result.get(String(item.adminId));
      if (roleIds) {
        result.set(String(item.adminId), [...roleIds, String(item.roleId)]);
      }
    }
    return result;
  }

  async bindRole(adminId: string, roleId: string): Promise<void> {
    await this.findEntityOrThrow(adminId);
    if (await this.adminRoles.findOne({ where: { adminId, roleId } })) {
      throw new DomainConflictError('管理员角色关系');
    }
    try {
      await this.adminRoles.save(this.adminRoles.create({ adminId, roleId }));
    } catch (error: unknown) {
      if (this.isDuplicate(error)) {
        throw new DomainConflictError('管理员角色关系');
      }
      throw error;
    }
  }

  async unbindRole(adminId: string, roleId: string): Promise<void> {
    await this.findEntityOrThrow(adminId);
    await this.adminRoles.delete({ adminId, roleId });
  }

  private async findEntityOrThrow(id: string): Promise<AdminEntity> {
    const item = await this.admins.findOne({
      where: { id },
    });
    if (!item) {
      throw new DomainNotFoundError('管理员');
    }
    return item;
  }

  private toRecord(item: AdminEntity): AdminRecord {
    return {
      id: String(item.id),
      username: item.username,
      passwordHash: item.passwordHash,
      passwordSalt: item.passwordSalt,
      isActive: item.isActive,
      isSuperAdmin: item.isSuperAdmin,
      deletedAt: item.deletedAt,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
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
