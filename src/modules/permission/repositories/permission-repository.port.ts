import type {
  PermissionCreateInput,
  PermissionDefinitionPatch,
  PermissionRecord
} from '#/modules/authorization/types/permission.types.js';
/** 权限仓储注入令牌。 */
export const PERMISSION_REPOSITORY = Symbol('PERMISSION_REPOSITORY');
/** 权限持久化访问契约。 */
export interface PermissionRepository {
  /** 查询记录列表 */
  list(): Promise<PermissionRecord[]>;
  /** 按标识查询记录 */
  findById(id: string): Promise<PermissionRecord | null>;
  /** 按标识批量查询记录 */
  findByIds(ids: string[]): Promise<PermissionRecord[]>;
  /** 按编码查询记录 */
  findByCode(code: string): Promise<PermissionRecord | null>;
  /** 创建记录 */
  create(input: PermissionCreateInput): Promise<PermissionRecord>;
  /** updateDefinition。 */
  updateDefinition(id: string, patch: PermissionDefinitionPatch): Promise<PermissionRecord>;
  /** setActive。 */
  setActive(id: string, isActive: boolean): Promise<PermissionRecord>;
}
