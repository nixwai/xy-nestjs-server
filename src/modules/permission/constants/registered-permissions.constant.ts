import { PermissionCode } from '#/modules/authorization/constants/index.js';
import type { RegisteredPermission } from '#/modules/authorization/types/permission.types.js';

/** 由代码维护的动态权限目录。 */
export const REGISTERED_PERMISSIONS: RegisteredPermission[] = [
  {
    code: PermissionCode.AUDIT_READ,
    name: '查看审计',
    description: '查看管理员变更审计',
    category: '审计',
    isAssignable: true,
    isProtected: false,
    isActive: true
  }
];
