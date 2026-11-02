import type { HttpMethod } from '../enums/http-method.enum.js';
import type { PermissionResource } from '../enums/permission-resource.enum.js';

/** 根据权限资源和 HTTP 方法生成稳定的权限编码。 */
export function createPermissionCode(resource: PermissionResource, method: HttpMethod): string {
  return `${resource.replaceAll('.', ':')}:${method}`;
}
