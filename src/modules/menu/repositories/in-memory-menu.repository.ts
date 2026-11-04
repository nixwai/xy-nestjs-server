import { DomainNotFoundError } from '#/common/errors/index.js';
import type { MenuRecord } from '../types/menu.types.js';
import type { MenuRepository } from './menu-repository.port.js';

export class InMemoryMenuRepository implements MenuRepository {
  private readonly items = new Map<string, MenuRecord>();
  private nextId = 1;
  async list() {
    return [...this.items.values()].filter(item => item.deletedAt === null).map(item => ({ ...item }));
  }
  async findById(id: string) {
    const item = this.items.get(id);
    return item && item.deletedAt === null ? { ...item } : null;
  }
  async create(input: Omit<MenuRecord, 'id' | 'deletedAt'>) {
    const item = { ...input, isRootOnly: input.isRootOnly ?? false, id: String(this.nextId++), deletedAt: null };
    this.items.set(item.id, item);
    return { ...item };
  }
  async update(
    id: string,
    input: Partial<
      Pick<MenuRecord, 'parentId' | 'title' | 'path' | 'icon' | 'order' | 'permissionCode' | 'isRootOnly' | 'isActive'>
    >
  ) {
    const item = await this.findById(id);
    if (!item) throw new DomainNotFoundError('菜单');
    const next = { ...item, ...input };
    this.items.set(id, next);
    return { ...next };
  }
  async softDelete(id: string) {
    const item = await this.findById(id);
    if (!item) throw new DomainNotFoundError('菜单');
    this.items.set(id, { ...item, deletedAt: new Date(), isActive: false });
  }
  async upsertSeed(input: Omit<MenuRecord, 'id' | 'deletedAt'>) {
    const found = [...this.items.values()].find(item => item.path === input.path);
    if (found) {
      const next = { ...found, ...input };
      this.items.set(found.id, next);
      return { ...next };
    }
    return this.create(input);
  }
}
