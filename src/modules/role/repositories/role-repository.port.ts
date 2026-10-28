import type { RoleRecord } from '../types/role.types.js';

/** 角色仓储注入令牌。 */
export const ROLE_REPOSITORY = Symbol('ROLE_REPOSITORY');

/** 角色持久化访问契约。 */
export interface RoleRepository {
  list(): Promise<RoleRecord[]>;
  findById(id: string): Promise<RoleRecord | null>;
  findByIds(ids: string[]): Promise<RoleRecord[]>;
  findByCode(code: string): Promise<RoleRecord | null>;
  create(input: {
    code: string;
    name: string;
    description?: string;
  }): Promise<RoleRecord>;
  update(
    id: string,
    input: Partial<Pick<RoleRecord, 'name' | 'description' | 'isActive'>>,
  ): Promise<RoleRecord>;
  remove(id: string): Promise<void>;
  bindPermission(roleId: string, permissionId: string): Promise<void>;
  unbindPermission(roleId: string, permissionId: string): Promise<void>;
}
