import { DomainConflictError, DomainNotFoundError } from '#/common/errors/index.js';
import type { AdminCreateInput, AdminRepository, AdminUpdateInput } from './admin-repository.port.js';
import { PageQueryDto } from '#/common/dto/index.js';
import type { PageResult } from '#/common/types/index.js';
import type { AdminRecord } from '../types/admin.types.js';

/** 在单元测试中保存管理员账户和角色关系。 */
export class InMemoryAdminRepository implements AdminRepository {
  private readonly admins = new Map<string, AdminRecord>();
  private readonly adminRoles = new Set<string>();
  private nextId = 1;

  async findByUsername(username: string): Promise<AdminRecord | null> {
    return [...this.admins.values()].find(item => item.deletedAt === null && item.username === username) ?? null;
  }

  async findById(id: string): Promise<AdminRecord | null> {
    const item = this.admins.get(id);
    return item && item.deletedAt === null ? { ...item } : null;
  }

  async list(query: PageQueryDto = new PageQueryDto()): Promise<PageResult<AdminRecord>> {
    const items = [...this.admins.values()]
      .filter(item => item.deletedAt === null)
      .sort((left, right) => Number(BigInt(right.id) - BigInt(left.id)));
    const total = items.length;
    const totalPages = total === 0 ? 0 : Math.ceil(total / query.pageSize);
    return {
      items: items.slice(query.skip, query.skip + query.pageSize).map(item => ({ ...item })),
      total,
      page: query.page,
      pageSize: query.pageSize,
      totalPages,
      hasNextPage: query.page < totalPages,
      hasPreviousPage: query.page > 1 && total > 0
    };
  }

  async create(input: AdminCreateInput): Promise<AdminRecord> {
    if (await this.findByUsername(input.username)) {
      throw new DomainConflictError('管理员用户名');
    }
    const now = new Date();
    const item: AdminRecord = {
      id: String(this.nextId++),
      username: input.username,
      passwordHash: input.passwordHash,
      passwordSalt: input.passwordSalt,
      isRoot: input.isRoot ?? false,
      isActive: true,
      deletedAt: null,
      createdAt: now,
      updatedAt: now
    };
    this.admins.set(item.id, item);
    return { ...item };
  }

  async update(id: string, input: AdminUpdateInput): Promise<AdminRecord> {
    const item = await this.findByIdOrThrow(id);
    if (input.username && input.username !== item.username && (await this.findByUsername(input.username)))
      throw new DomainConflictError('管理员用户名');
    const updated = { ...item, ...input, updatedAt: new Date() };
    this.admins.set(id, updated);
    return { ...updated };
  }

  async softDelete(id: string): Promise<void> {
    const item = await this.findByIdOrThrow(id);
    const deletedAt = new Date();
    this.admins.set(id, {
      ...item,
      deletedAt,
      updatedAt: deletedAt
    });
    for (const relation of this.adminRoles) {
      if (relation.startsWith(`${id}:`)) {
        this.adminRoles.delete(relation);
      }
    }
  }

  async countActiveRoots(): Promise<number> {
    return [...this.admins.values()].filter(item => item.deletedAt === null && item.isActive && item.isRoot).length;
  }

  async listRoleIds(adminId: string): Promise<string[]> {
    await this.findByIdOrThrow(adminId);
    return [...this.adminRoles]
      .filter(item => item.startsWith(`${adminId}:`))
      .map(item => item.slice(adminId.length + 1));
  }

  async listRoleIdsByAdminIds(adminIds: string[]): Promise<Map<string, string[]>> {
    const result = new Map<string, string[]>(adminIds.map(id => [id, []]));
    for (const key of this.adminRoles) {
      const separator = key.indexOf(':');
      const adminId = key.slice(0, separator);
      const roleId = key.slice(separator + 1);
      const roleIds = result.get(adminId);
      if (roleIds) {
        result.set(adminId, [...roleIds, roleId]);
      }
    }
    return result;
  }

  async bindRole(adminId: string, roleId: string): Promise<void> {
    await this.findByIdOrThrow(adminId);
    const key = `${adminId}:${roleId}`;
    if (this.adminRoles.has(key)) {
      throw new DomainConflictError('管理员角色关系');
    }
    this.adminRoles.add(key);
  }

  async unbindRole(adminId: string, roleId: string): Promise<void> {
    await this.findByIdOrThrow(adminId);
    this.adminRoles.delete(`${adminId}:${roleId}`);
  }

  private async findByIdOrThrow(id: string): Promise<AdminRecord> {
    const item = await this.findById(id);
    if (!item) {
      throw new DomainNotFoundError('管理员');
    }
    return item;
  }
}
