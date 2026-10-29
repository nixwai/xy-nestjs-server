import {
  DomainConflictError,
  DomainNotFoundError,
} from '../../../common/errors/index.js';
import type { RoleRecord } from '../types/role.types.js';
import type { RoleRepository } from './role-repository.port.js';

/** 在单元测试中保存角色及其权限关系。 */
export class InMemoryRoleRepository implements RoleRepository {
  private readonly roles = new Map<string, RoleRecord>();
  private nextId = 1;

  async list(): Promise<RoleRecord[]> {
    return [...this.roles.values()]
      .filter((item) => item.deletedAt === null)
      .map((item) => this.copy(item));
  }

  async findById(id: string): Promise<RoleRecord | null> {
    const item = this.roles.get(id);
    return item && item.deletedAt === null ? this.copy(item) : null;
  }

  async findByIds(ids: string[]): Promise<RoleRecord[]> {
    const records = await Promise.all(ids.map((id) => this.findById(id)));
    return records.filter((item): item is RoleRecord => item !== null);
  }

  async findByCode(code: string): Promise<RoleRecord | null> {
    const item = [...this.roles.values()].find(
      (role) => role.deletedAt === null && role.code === code,
    );
    return item ? this.copy(item) : null;
  }

  async create(input: {
    code: string;
    name: string;
    description?: string;
  }): Promise<RoleRecord> {
    if (await this.findByCode(input.code)) {
      throw new DomainConflictError('角色编码');
    }
    const item: RoleRecord = {
      id: String(this.nextId++),
      code: input.code,
      name: input.name,
      description: input.description ?? null,
      isActive: true,
      deletedAt: null,
      permissionIds: [],
    };
    this.roles.set(item.id, item);
    return this.copy(item);
  }

  async update(
    id: string,
    input: Partial<Pick<RoleRecord, 'name' | 'description' | 'isActive'>>,
  ): Promise<RoleRecord> {
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
      permissionIds: [...item.permissionIds, permissionId],
    });
  }

  async unbindPermission(roleId: string, permissionId: string): Promise<void> {
    const item = await this.findByIdOrThrow(roleId);
    this.roles.set(roleId, {
      ...item,
      permissionIds: item.permissionIds.filter((id) => id !== permissionId),
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
