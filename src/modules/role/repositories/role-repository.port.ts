import type { PageQueryDto } from '#/common/dto/index.js';
import type { PageResult } from '#/common/types/index.js';
import type { RoleCreateInput, RoleRecord, RoleUpdateInput } from '../types/role.types.js';

/** 角色仓储注入令牌。 */
export const ROLE_REPOSITORY = Symbol('ROLE_REPOSITORY');

/** 角色持久化访问契约。 */
export interface RoleRepository {
  list(query: PageQueryDto): Promise<PageResult<RoleRecord>>;
  findById(id: string): Promise<RoleRecord | null>;
  findByIds(ids: string[]): Promise<RoleRecord[]>;
  findByCode(code: string): Promise<RoleRecord | null>;
  create(input: RoleCreateInput): Promise<RoleRecord>;
  update(id: string, input: RoleUpdateInput): Promise<RoleRecord>;
  softDelete(id: string): Promise<void>;
  bindPermission(roleId: string, permissionId: string): Promise<void>;
  unbindPermission(roleId: string, permissionId: string): Promise<void>;
}
