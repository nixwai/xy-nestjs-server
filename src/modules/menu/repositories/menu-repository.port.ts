import type { MenuCreateInput, MenuRecord, MenuUpdateInput } from '../types/menu.types.js';
/** 菜单仓储注入令牌。 */
export const MENU_REPOSITORY = Symbol('MENU_REPOSITORY');
/** 菜单持久化访问契约。 */
export interface MenuRepository {
  /** 查询记录列表 */
  list(): Promise<MenuRecord[]>;
  /** 按标识查询记录 */
  findById(id: string): Promise<MenuRecord | null>;
  /** 按菜单标识查询记录 */
  findByMenuKey(menuKey: string): Promise<MenuRecord | null>;
  /** 创建记录 */
  create(input: MenuCreateInput): Promise<MenuRecord>;
  /** 更新记录 */
  update(id: string, input: MenuUpdateInput): Promise<MenuRecord>;
}
