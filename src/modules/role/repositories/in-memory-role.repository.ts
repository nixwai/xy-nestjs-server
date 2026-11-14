import { DomainConflictError, DomainNotFoundError } from '#/common/errors/index.js';
import { PageQueryDto } from '#/common/dto/index.js';
import type { PageResult } from '#/common/types/index.js';
import type { RoleCreateInput, RoleRecord, RoleUpdateInput } from '../types/role.types.js';
import type { RoleRepository } from './role-repository.port.js';
/** 在单元测试中保存角色及其权限关系。 */
export class InMemoryRoleRepository implements RoleRepository {
  /** 当前管理员拥有的角色列表。 */
  private readonly roles = new Map<string, RoleRecord>();
  /** 记录创建时间。 */
  private readonly createdAt = new Map<string, number>();
  /** 下一个可分配的内存记录标识。 */
  private nextId = 1;
  /** 查询记录列表 */
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

  /** 按标识查询记录 */
  async findById(id: string): Promise<RoleRecord | null> {
    const item = this.roles.get(id);
    return item && item.deletedAt === null ? this.copy(item) : null;
  }

  /** 按标识批量查询记录 */
  async findByIds(ids: string[]): Promise<RoleRecord[]> {
    const records = await Promise.all(ids.map(id => this.findById(id)));
    return records.filter((item): item is RoleRecord => item !== null);
  }

  /** 按编码查询记录 */
  async findByCode(code: string): Promise<RoleRecord | null> {
    const item = [...this.roles.values()].find(role => role.deletedAt === null && role.code === code);
    return item ? this.copy(item) : null;
  }

  /** 创建记录 */
  async create(input: RoleCreateInput): Promise<RoleRecord> {
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

  /** 更新记录 */
  async update(id: string, input: RoleUpdateInput): Promise<RoleRecord> {
    const item = await this.findByIdOrThrow(id);
    const updated = { ...item, ...input };
    this.roles.set(id, updated);
    return this.copy(updated);
  }

  /** 软删除记录 */
  async softDelete(id: string): Promise<void> {
    const item = await this.findByIdOrThrow(id);
    this.roles.set(id, { ...item, deletedAt: new Date() });
  }

  /** 批量为角色绑定权限 */
  async bindPermissions(roleId: string, permissionIds: string[]): Promise<void> {
    const item = await this.findByIdOrThrow(roleId);
    const uniquePermissionIds = [...new Set(permissionIds)];
    const existing = new Set(item.permissionIds);
    if (uniquePermissionIds.some(permissionId => existing.has(permissionId))) {
      throw new DomainConflictError('角色权限关系');
    }
    this.roles.set(roleId, {
      ...item,
      permissionIds: [...item.permissionIds, ...uniquePermissionIds]
    });
  }

  /** 批量解除角色权限绑定，不检查权限目录是否仍存在 */
  async unbindPermissions(roleId: string, permissionIds: string[]): Promise<void> {
    const item = await this.findByIdOrThrow(roleId);
    const toRemove = new Set(permissionIds);
    this.roles.set(roleId, {
      ...item,
      permissionIds: item.permissionIds.filter(id => !toRemove.has(id))
    });
  }

  /** 按标识查询记录，不存在时抛出异常 */
  private async findByIdOrThrow(id: string): Promise<RoleRecord> {
    const item = await this.findById(id);
    if (!item) {
      throw new DomainNotFoundError('角色');
    }
    return item;
  }

  /** 复制记录 */
  private copy(item: RoleRecord): RoleRecord {
    return { ...item, permissionIds: [...item.permissionIds] };
  }
}
