import type { PermissionRecord, RegisteredPermission } from '#/modules/authorization/types/permission.types.js';

/** 权限仓储注入令牌。 */
export const PERMISSION_REPOSITORY = Symbol('PERMISSION_REPOSITORY');

/** 权限持久化访问契约。 */
export interface PermissionRepository {
  list(): Promise<PermissionRecord[]>;
  findById(id: string): Promise<PermissionRecord | null>;
  findByIds(ids: string[]): Promise<PermissionRecord[]>;
  findByCode(code: string): Promise<PermissionRecord | null>;
  upsertRegistered(input: RegisteredPermission): Promise<PermissionRecord>;
  setActive(id: string, isActive: boolean): Promise<PermissionRecord>;
}
