import { DomainNotFoundError } from '#/common/errors/index.js';
import type { PermissionRecord, RegisteredPermission } from '#/modules/authorization/types/permission.types.js';
import type { PermissionRepository } from './permission-repository.port.js';

/** 在单元测试中保存动态权限目录。 */
export class InMemoryPermissionRepository implements PermissionRepository {
  private readonly permissions = new Map<string, PermissionRecord>();
  private nextId = 1;

  async list(): Promise<PermissionRecord[]> {
    return [...this.permissions.values()]
      .sort((left, right) => left.category.localeCompare(right.category) || left.code.localeCompare(right.code))
      .map(item => ({ ...item }));
  }

  async findById(id: string): Promise<PermissionRecord | null> {
    const item = this.permissions.get(id);
    return item ? { ...item } : null;
  }

  async findByIds(ids: string[]): Promise<PermissionRecord[]> {
    return ids.flatMap(id => {
      const item = this.permissions.get(id);
      return item ? [{ ...item }] : [];
    });
  }

  async findByCode(code: string): Promise<PermissionRecord | null> {
    const item = [...this.permissions.values()].find(permission => permission.code === code);
    return item ? { ...item } : null;
  }

  async ensureRegistered(input: RegisteredPermission): Promise<PermissionRecord> {
    const existing = [...this.permissions.values()].find(item => item.code === input.code);
    if (existing) {
      const updated = {
        ...existing,
        code: input.code,
        name: input.name,
        description: input.description,
        category: input.category,
        isAssignable: input.isAssignable,
        isProtected: input.isProtected,
        isActive: existing.isActive
      };
      this.permissions.set(existing.id, updated);
      return { ...updated };
    }
    const item: PermissionRecord = { id: String(this.nextId++), ...input };
    this.permissions.set(item.id, item);
    return { ...item };
  }

  async setActive(id: string, isActive: boolean): Promise<PermissionRecord> {
    const item = await this.findById(id);
    if (!item) throw new DomainNotFoundError('权限');
    const updated = { ...item, isActive };
    this.permissions.set(id, updated);
    return { ...updated };
  }
}
