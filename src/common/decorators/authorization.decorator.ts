import { SetMetadata } from '@nestjs/common';
import { PermissionResource } from '../enums/permission-resource.enum.js';

/** 公开路由使用的元数据键。 */
export const PUBLIC_ROUTE_KEY = 'publicRoute';

/** 权限要求使用的元数据键。 */
export const PERMISSION_KEY = 'requiredPermission';

/** 超级管理员限制使用的元数据键。 */
export const SUPER_ADMIN_ONLY_KEY = 'superAdminOnly';

/** 路由声明的权限要求。 */
export interface RequiredPermission {
  resource: PermissionResource;
}

/** 标记路由允许未认证访问。 */
export const Public = () => SetMetadata(PUBLIC_ROUTE_KEY, true);

/** 声明路由所需的权限资源。 */
export const RequirePermission = (resource: PermissionResource) =>
  SetMetadata(PERMISSION_KEY, { resource } satisfies RequiredPermission);

/** 标记路由仅允许超级管理员访问。 */
export const SuperAdminOnly = () => SetMetadata(SUPER_ADMIN_ONLY_KEY, true);
