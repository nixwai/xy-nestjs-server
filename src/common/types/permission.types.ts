import { HttpMethod } from '../enums/http-method.enum.js';
import { PermissionResource } from '../enums/permission-resource.enum.js';

/** 权限目录中的权限记录。 */
export interface PermissionRecord {
  id: string;
  code: string;
  resource: PermissionResource;
  method: HttpMethod;
  name: string;
  description: string | null;
  isActive: boolean;
}

/** 代码注册的权限记录。 */
export type RegisteredPermission = Omit<PermissionRecord, 'id'>;
