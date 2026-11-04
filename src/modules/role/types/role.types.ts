export interface RoleRecord {
  id: string;
  code: string;
  name: string;
  description: string | null;
  isActive: boolean;
  isSystem: boolean;
  isProtected: boolean;
  deletedAt: Date | null;
  permissionIds: string[];
}
