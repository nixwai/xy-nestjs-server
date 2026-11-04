import { DomainConflictError, DomainNotFoundError } from '#/common/errors/index.js';
import { PageQueryDto } from '#/common/dto/index.js';
import type { PageResult } from '#/common/types/index.js';
import type { RoleRecord } from '../types/role.types.js';
import type { RoleRepository } from './role-repository.port.js';

/** 在单元测试中保存角色及其权限关系。 */
export class InMemoryRoleRepository implements RoleRepository {
  private readonly roles = new Map<string, RoleRecord>();
  private readonly createdAt = new Map<string, number>();
  private nextId = 1;

  async list(query: PageQueryDto = new PageQueryDto()): Promise<PageResult<RoleRecord>> {
    const items = [...this.roles.values()]
      .filter(item => item.deletedAt === null)
      .sort((left, right) => Number(BigInt(right.id) - BigInt(left.id)));
    const total = items.length;
    const totalPages = total === 0 ? 0 : Math.ceil(total / query.pageSize);
    return {
      items: items.slice(query.skip, query.skip + query.pageSize).map(item => this.copy(item)),
      total,
      page: query.page,
      pageSize: query.pageSize,
      totalPages,
      hasNextPage: query.page < totalPages,
      hasPreviousPage: query.page > 1 && total > 0
    };
  }

  async findById(id: string): Promise<RoleRecord | null> {
    const item = this.roles.get(id);
    return item && item.deletedAt === null ? this.copy(item) : null;
  }

  async findByIds(ids: string[]): Promise<RoleRecord[]> {
    const records = await Promise.all(ids.map(id => this.findById(id)));
    return records.filter((item): item is RoleRecord => item !== null);
  }

  async findByCode(code: string): Promise<RoleRecord | null> {
    const item = [...this.roles.values()].find(role => role.deletedAt === null && role.code === code);
    return item ? this.copy(item) : null;
  }

  async create(input: { code: string; name: string; description?: string }): Promise<RoleRecord> {
    if (await this.findByCode(input.code)) {
      throw new DomainConflictError('角色编码');
    }
    const item: RoleRecord = {
      id: String(this.nextId++),
      code: input.code,
      name: input.name,
      description: input.description ?? null,
      isActive: true,
      isSystem: false,
      isProtected: false,
      deletedAt: null,
      permissionIds: []
    };
    this.roles.set(item.id, item);
    this.createdAt.set(item.id, Date.now());
    return this.copy(item);
  }

  async update(id: string, input: Partial<Pick<RoleRecord, 'name' | 'description' | 'isActive'>>): Promise<RoleRecord> {
    const item = await this.findByIdOrThrow(id);
    const updated = { ...item, ...input };
    this.roles.set(id, updated);
    return this.copy(updated);
  }

  async softDelete(id: string): Promise<void> {
    const item = await this.findByIdOrThrow(id);
    this.roles.set(id, { ...item, deletedAt: new Date() });
  }

  async bindPermission(roleId: string, permissionId: string): Promise<void> {
    const item = await this.findByIdOrThrow(roleId);
    if (item.permissionIds.includes(permissionId)) {
      throw new DomainConflictError('角色权限关系');
    }
    this.roles.set(roleId, {
      ...item,
      permissionIds: [...item.permissionIds, permissionId]
    });
  }

  async unbindPermission(roleId: string, permissionId: string): Promise<void> {
    const item = await this.findByIdOrThrow(roleId);
    this.roles.set(roleId, {
      ...item,
      permissionIds: item.permissionIds.filter(id => id !== permissionId)
    });
  }

  private async findByIdOrThrow(id: string): Promise<RoleRecord> {
    const item = await this.findById(id);
    if (!item) {
      throw new DomainNotFoundError('角色');
    }
    return item;
  }

  private copy(item: RoleRecord): RoleRecord {
    return { ...item, permissionIds: [...item.permissionIds] };
  }
}
