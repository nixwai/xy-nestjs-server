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

export interface MenuListItem extends MenuRecord {
  permissionAvailable: boolean;
}
