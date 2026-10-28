export interface RoleRecord {
  id: string;
  code: string;
  name: string;
  description: string | null;
  isActive: boolean;
  isDeleted: boolean;
  permissionIds: string[];
}
