import { DomainNotFoundError } from '#/common/errors/index.js';
import type { MenuCreateInput, MenuRecord, MenuUpdateInput } from '../types/menu.types.js';
import type { MenuRepository } from './menu-repository.port.js';
/** 定义 InMemoryMenuRepository。 */
export class InMemoryMenuRepository implements MenuRepository {
  /** 列表数据。 */
  private readonly items = new Map<string, MenuRecord>();
  /** 下一个可分配的内存记录标识。 */
  private nextId = 1;
  /** 查询记录列表 */
  async list() {
    return [...this.items.values()].map(item => ({ ...item }));
  }

  /** 按标识查询记录 */
  async findById(id: string) {
    const item = this.items.get(id);
    return item ? { ...item } : null;
  }

  /** 按菜单标识查询记录 */
  async findByMenuKey(menuKey: string) {
    const item = [...this.items.values()].find(candidate => candidate.menuKey === menuKey);
    return item ? { ...item } : null;
  }

  /** 创建记录 */
  async create(input: MenuCreateInput) {
    const item = { ...input, id: String(this.nextId++) };
    this.items.set(item.id, item);
    return { ...item };
  }

  /** 更新记录 */
  async update(id: string, input: MenuUpdateInput) {
    const item = await this.findById(id);
    if (!item) throw new DomainNotFoundError('菜单');
    const next = { ...item, ...input };
    this.items.set(id, next);
    return { ...next };
  }
}
