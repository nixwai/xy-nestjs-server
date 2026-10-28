export interface AdminRecord {
  id: string;
  username: string;
  passwordHash: string;
  passwordSalt: string;
  isActive: boolean;
  isSuperAdmin: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}
export interface AdminPublicRecord {
  id: string;
  username: string;
  isActive: boolean;
  isSuperAdmin: boolean;
  roleIds: string[];
  createdAt: Date;
  updatedAt: Date;
}
export interface AdminAuthorization {
  admin: AdminPublicRecord;
  roles: import('../../role/types/role.types.js').RoleRecord[];
  permissions: import('../../../common/types/permission.types.js').PermissionRecord[];
}
