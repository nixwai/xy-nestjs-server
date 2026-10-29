export interface RoleRecord {
  id: string;
  code: string;
  name: string;
  description: string | null;
  isActive: boolean;
  deletedAt: Date | null;
  permissionIds: string[];
}
