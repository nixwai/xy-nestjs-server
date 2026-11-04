export interface MenuRecord {
  id: string;
  parentId: string | null;
  title: string;
  path: string;
  icon: string | null;
  order: number;
  permissionCode: string | null;
  isRootOnly: boolean;
  isActive: boolean;
  deletedAt: Date | null;
}
