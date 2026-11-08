import { DomainNotFoundError } from '#/common/errors/index.js';
import type {
  PermissionCreateInput,
  PermissionDefinitionPatch,
  PermissionRecord
} from '#/modules/authorization/types/permission.types.js';
import type { PermissionRepository } from './permission-repository.port.js';
/** 在单元测试中保存动态权限目录。 */
export class InMemoryPermissionRepository implements PermissionRepository {
  /** 当前身份可使用的权限编码列表。 */
  private readonly permissions = new Map<string, PermissionRecord>();
  /** 下一个可分配的内存记录标识。 */
  private nextId = 1;
  /** 查询记录列表 */
  async list(): Promise<PermissionRecord[]> {
    return [...this.permissions.values()]
      .sort((left, right) => left.category.localeCompare(right.category) || left.code.localeCompare(right.code))
      .map(item => ({ ...item }));
  }

  /** 按标识查询记录 */
  async findById(id: string): Promise<PermissionRecord | null> {
    const item = this.permissions.get(id);
    return item ? { ...item } : null;
  }

  /** 按标识批量查询记录 */
  async findByIds(ids: string[]): Promise<PermissionRecord[]> {
    return ids.flatMap(id => {
      const item = this.permissions.get(id);
      return item ? [{ ...item }] : [];
    });
  }

  /** 按编码查询记录 */
  async findByCode(code: string): Promise<PermissionRecord | null> {
    const item = [...this.permissions.values()].find(permission => permission.code === code);
    return item ? { ...item } : null;
  }

  /** 创建记录 */
  async create(input: PermissionCreateInput): Promise<PermissionRecord> {
    const item: PermissionRecord = { ...input, id: String(this.nextId++) };
    this.permissions.set(item.id, item);
    return { ...item };
  }

  /** updateDefinition。 */
  async updateDefinition(id: string, patch: PermissionDefinitionPatch): Promise<PermissionRecord> {
    const item = this.permissions.get(id);
    if (!item) throw new DomainNotFoundError('权限');
    const updated = { ...item, ...patch };
    this.permissions.set(id, updated);
    return { ...updated };
  }

  /** setActive。 */
  async setActive(id: string, isActive: boolean): Promise<PermissionRecord> {
    const item = await this.findById(id);
    if (!item) throw new DomainNotFoundError('权限');
    const updated = { ...item, isActive };
    this.permissions.set(id, updated);
    return { ...updated };
  }
}
