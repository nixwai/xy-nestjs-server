import { SetMetadata } from '@nestjs/common';
import type { PermissionCode } from '../types/index.js';

/** 公开路由使用的元数据键。 */
export const PUBLIC_ROUTE_KEY = 'publicRoute';

/** 登录用户路由使用的元数据键。 */
export const AUTHENTICATED_ROUTE_KEY = 'authenticatedRoute';

/** 权限要求使用的元数据键。 */
export const PERMISSION_KEY = 'requiredPermission';

/** 根管理员限制使用的元数据键。 */
export const ROOT_ONLY_KEY = 'rootOnly';

/** 标记路由允许未认证访问。 */
export const Public = () => SetMetadata(PUBLIC_ROUTE_KEY, true);

/** 标记路由只要求当前用户已认证。 */
export const Authenticated = () => SetMetadata(AUTHENTICATED_ROUTE_KEY, true);

/** 声明路由所需的动态权限编码。 */
export const RequirePermission = (permissionCode: PermissionCode) => SetMetadata(PERMISSION_KEY, permissionCode);

/** 标记路由仅允许根管理员访问。 */
export const RootOnly = () => SetMetadata(ROOT_ONLY_KEY, true);
