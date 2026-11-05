import type { PageQueryDto } from '#/common/dto/index.js';
import type { PageResult } from '#/common/types/index.js';
import type { AdminCreateInput, AdminRecord, AdminUpdateInput } from '../types/admin.types.js';

/** 管理员仓储注入令牌。 */
export const ADMIN_REPOSITORY = Symbol('ADMIN_REPOSITORY');

/** 管理员持久化访问契约。 */
export interface AdminRepository {
  findByUsername(username: string): Promise<AdminRecord | null>;
  findById(id: string): Promise<AdminRecord | null>;
  list(query: PageQueryDto): Promise<PageResult<AdminRecord>>;
  create(input: AdminCreateInput): Promise<AdminRecord>;
  update(id: string, input: AdminUpdateInput): Promise<AdminRecord>;
  softDelete(id: string): Promise<void>;
  countActiveRoots(): Promise<number>;
  listRoleIds(adminId: string): Promise<string[]>;
  listRoleIdsByAdminIds(adminIds: string[]): Promise<Map<string, string[]>>;
  bindRole(adminId: string, roleId: string): Promise<void>;
  unbindRole(adminId: string, roleId: string): Promise<void>;
}

/** 管理员创建事务协调契约。 */
export const ADMIN_TRANSACTION_RUNNER = Symbol('ADMIN_TRANSACTION_RUNNER');

/** 在管理员仓储作用域内执行事务。 */
export interface AdminTransactionRunner {
  run<T>(work: (repository: AdminRepository) => Promise<T>): Promise<T>;
}
