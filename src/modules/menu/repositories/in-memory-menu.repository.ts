import { DomainNotFoundError } from '#/common/errors/index.js';
import type { MenuCreateInput, MenuRecord, MenuUpdateInput } from '../types/menu.types.js';
import type { MenuRepository } from './menu-repository.port.js';

export class InMemoryMenuRepository implements MenuRepository {
  private readonly items = new Map<string, MenuRecord>();
  private nextId = 1;

  async list() {
    return [...this.items.values()].map(item => ({ ...item }));
  }

  async findById(id: string) {
    const item = this.items.get(id);
    return item ? { ...item } : null;
  }

  async findByMenuKey(menuKey: string) {
    const item = [...this.items.values()].find(candidate => candidate.menuKey === menuKey);
    return item ? { ...item } : null;
  }

  async create(input: MenuCreateInput) {
    const item = { ...input, id: String(this.nextId++) };
    this.items.set(item.id, item);
    return { ...item };
  }

  async update(id: string, input: MenuUpdateInput) {
    const item = await this.findById(id);
    if (!item) throw new DomainNotFoundError('菜单');
    const next = { ...item, ...input };
    this.items.set(id, next);
    return { ...next };
  }
}
