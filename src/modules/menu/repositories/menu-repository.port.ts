import type { MenuRecord } from '../types/menu.types.js';

export const MENU_REPOSITORY = Symbol('MENU_REPOSITORY');
export interface MenuRepository {
  list(): Promise<MenuRecord[]>;
  findById(id: string): Promise<MenuRecord | null>;
  create(input: Omit<MenuRecord, 'id' | 'deletedAt'>): Promise<MenuRecord>;
  update(
    id: string,
    input: Partial<
      Pick<MenuRecord, 'parentId' | 'title' | 'path' | 'icon' | 'order' | 'permissionCode' | 'isRootOnly' | 'isActive'>
    >
  ): Promise<MenuRecord>;
  softDelete(id: string): Promise<void>;
  /** 确保种子菜单存在，已存在时不覆盖数据库内容。 */
  ensureSeed(input: Omit<MenuRecord, 'id' | 'deletedAt'>): Promise<MenuRecord>;
}
