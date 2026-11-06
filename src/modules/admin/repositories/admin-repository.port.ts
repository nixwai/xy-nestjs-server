import type { PageQueryDto } from '#/common/dto/index.js';
import type { PageResult } from '#/common/types/index.js';
import type { AdminCreateInput, AdminRecord, AdminUpdateInput } from '../types/admin.types.js';
/** 管理员仓储注入令牌。 */
export const ADMIN_REPOSITORY = Symbol('ADMIN_REPOSITORY');
/** 管理员持久化访问契约。 */
export interface AdminRepository {
  /** 按用户名查询记录 */
  findByUsername(username: string): Promise<AdminRecord | null>;
  /** 按标识查询记录 */
  findById(id: string): Promise<AdminRecord | null>;
  /** 查询记录列表 */
  list(query: PageQueryDto): Promise<PageResult<AdminRecord>>;
  /** 创建记录 */
  create(input: AdminCreateInput): Promise<AdminRecord>;
  /** 更新记录 */
  update(id: string, input: AdminUpdateInput): Promise<AdminRecord>;
  /** 软删除记录 */
  softDelete(id: string): Promise<void>;
  /** countActiveRoots。 */
  countActiveRoots(): Promise<number>;
  /** listRoleIds。 */
  listRoleIds(adminId: string): Promise<string[]>;
  /** listRoleIdsByAdminIds。 */
  listRoleIdsByAdminIds(adminIds: string[]): Promise<Map<string, string[]>>;
  /** 为管理员绑定角色 */
  bindRole(adminId: string, roleId: string): Promise<void>;
  /** 解除管理员角色绑定 */
  unbindRole(adminId: string, roleId: string): Promise<void>;
}

/** 管理员创建事务协调契约。 */
export const ADMIN_TRANSACTION_RUNNER = Symbol('ADMIN_TRANSACTION_RUNNER');
/** 在管理员仓储作用域内执行事务。 */
export interface AdminTransactionRunner {
  /** run。 */
  run<T>(work: (repository: AdminRepository) => Promise<T>): Promise<T>;
}
