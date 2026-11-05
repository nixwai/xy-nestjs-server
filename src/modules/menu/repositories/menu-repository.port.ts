import type { MenuCreateInput, MenuRecord, MenuUpdateInput } from '../types/menu.types.js';

/** 菜单仓储注入令牌。 */
export const MENU_REPOSITORY = Symbol('MENU_REPOSITORY');

/** 菜单持久化访问契约。 */
export interface MenuRepository {
  list(): Promise<MenuRecord[]>;
  findById(id: string): Promise<MenuRecord | null>;
  findByMenuKey(menuKey: string): Promise<MenuRecord | null>;
  create(input: MenuCreateInput): Promise<MenuRecord>;
  update(id: string, input: MenuUpdateInput): Promise<MenuRecord>;
}
