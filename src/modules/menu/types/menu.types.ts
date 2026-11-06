/** 菜单持久化记录。 */
export interface MenuRecord {
  /** 唯一标识。 */
  id: string;
  /** 菜单稳定标识。 */
  menuKey: string;
  /** 父级菜单标识。 */
  parentKey: string | null;
  /** 菜单展示标题。 */
  title: string;
  /** 请求路径。 */
  path: string;
  /** 菜单显示顺序。 */
  order: number;
  /** 权限编码。 */
  permissionCode: string | null;
  /** 是否仅根管理员可见。 */
  isRootOnly: boolean;
  /** 是否启用。 */
  isActive: boolean;
}

/** 管理端菜单列表项，附带菜单所需权限当前是否可用。 */
export interface MenuListItem extends MenuRecord {
  /** 权限可用性。 */
  permissionAvailable: boolean;
}

/** 菜单创建输入。 */
export type MenuCreateInput = Omit<MenuRecord, 'id'>;
/** 菜单展示配置更新输入。 */
export type MenuUpdateInput = Partial<Pick<MenuRecord, 'title' | 'order' | 'isActive'>>;
/** 启动校验覆盖的菜单结构属性。 */
export type MenuStructureField = keyof Pick<MenuRecord, 'path' | 'permissionCode' | 'isRootOnly'>;
