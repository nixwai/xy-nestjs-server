/** 菜单持久化记录。 */
export interface MenuRecord {
  id: string;
  menuKey: string;
  parentKey: string | null;
  title: string;
  path: string;
  order: number;
  permissionCode: string | null;
  isRootOnly: boolean;
  isActive: boolean;
}

/** 管理端菜单列表项，附带菜单所需权限当前是否可用。 */
export interface MenuListItem extends MenuRecord {
  permissionAvailable: boolean;
}

/** 菜单创建输入。 */
export type MenuCreateInput = Omit<MenuRecord, 'id'>;

/** 菜单展示配置更新输入。 */
export type MenuUpdateInput = Partial<Pick<MenuRecord, 'title' | 'order' | 'isActive'>>;

/** 启动校验覆盖的菜单结构字段。 */
export type MenuStructureField = keyof Pick<MenuRecord, 'path' | 'permissionCode' | 'isRootOnly'>;
