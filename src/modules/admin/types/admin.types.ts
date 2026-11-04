export interface AdminRecord {
  id: string;
  username: string;
  passwordHash: string;
  passwordSalt: string;
  isActive: boolean;
  isRoot: boolean;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
export interface AdminPublicRecord {
  id: string;
  username: string;
  isActive: boolean;
  isRoot: boolean;
  roleIds: string[];
  createdAt: Date;
  updatedAt: Date;
}
export interface AdminAuthorization {
  admin: AdminPublicRecord;
  roles: import('#/modules/role/types/role.types.js').RoleRecord[];
  permissions: import('#/modules/authorization/types/permission.types.js').PermissionRecord[];
}
