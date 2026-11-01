import type { MenuRecord } from '../types/menu.types.js';
export const MENU_REPOSITORY = Symbol('MENU_REPOSITORY');
export interface MenuRepository { list(): Promise<MenuRecord[]>; findById(id: string): Promise<MenuRecord | null>; create(input: Omit<MenuRecord, 'id'|'deletedAt'>): Promise<MenuRecord>; update(id: string, input: Partial<Pick<MenuRecord,'parentId'|'title'|'path'|'icon'|'order'|'permissionCode'|'isActive'>>): Promise<MenuRecord>; softDelete(id: string): Promise<void>; upsertSeed(input: Omit<MenuRecord,'id'|'deletedAt'>): Promise<MenuRecord>; }
