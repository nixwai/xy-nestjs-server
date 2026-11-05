import type { MenuRecord } from '../types/menu.types.js';

export const MENU_REPOSITORY = Symbol('MENU_REPOSITORY');
export interface MenuRepository {
  list(): Promise<MenuRecord[]>;
  findById(id: string): Promise<MenuRecord | null>;
  findByMenuKey(menuKey: string): Promise<MenuRecord | null>;
  create(input: Omit<MenuRecord, 'id'>): Promise<MenuRecord>;
  update(id: string, input: Partial<Pick<MenuRecord, 'title' | 'order' | 'isActive'>>): Promise<MenuRecord>;
}
