import type { PageQueryDto } from '#/common/dto/index.js';
import type { PageResult } from '#/common/types/index.js';
import type { RoleCreateInput, RoleRecord, RoleUpdateInput } from '../types/role.types.js';
/** 角色仓储注入令牌。 */
export const ROLE_REPOSITORY = Symbol('ROLE_REPOSITORY');
/** 角色持久化访问契约。 */
export interface RoleRepository {
  /** 查询记录列表 */
  list(query: PageQueryDto): Promise<PageResult<RoleRecord>>;
  /** 按标识查询记录 */
  findById(id: string): Promise<RoleRecord | null>;
  /** 按标识批量查询记录 */
  findByIds(ids: string[]): Promise<RoleRecord[]>;
  /** 按编码查询记录 */
  findByCode(code: string): Promise<RoleRecord | null>;
  /** 创建记录 */
  create(input: RoleCreateInput): Promise<RoleRecord>;
  /** 更新记录 */
  update(id: string, input: RoleUpdateInput): Promise<RoleRecord>;
  /** 软删除记录 */
  softDelete(id: string): Promise<void>;
  /** 为角色绑定权限 */
  bindPermission(roleId: string, permissionId: string): Promise<void>;
  /** 解除角色权限绑定 */
  unbindPermission(roleId: string, permissionId: string): Promise<void>;
}
