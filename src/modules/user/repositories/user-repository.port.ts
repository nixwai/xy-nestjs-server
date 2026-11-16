import type { PageQueryDto } from '#/common/dto/index.js';
import type { PageResult } from '#/common/types/index.js';
import type { UserCreateInput, UserRecord, UserUpdateInput, UserWechatIdentityInput } from '../types/user.types.js';

/** 用户仓储注入令牌。 */
export const USER_REPOSITORY = Symbol('USER_REPOSITORY');

/** 用户持久化访问契约。 */
export interface UserRepository {
  /** 按主键查询用户。 */
  findById(id: string): Promise<UserRecord | null>;
  /** 按微信 openId 查询用户。 */
  findByOpenId(openId: string): Promise<UserRecord | null>;
  /** 按条件分页查询用户。 */
  list(query: PageQueryDto & { keyword?: string; isActive?: boolean }): Promise<PageResult<UserRecord>>;
  /** 创建用户，可不绑定外部登录身份。
   */
  create(input: UserCreateInput): Promise<UserRecord>;
  /** 按微信身份幂等创建或更新用户。 */
  upsertByWechatIdentity(input: UserWechatIdentityInput): Promise<UserRecord>;
  /** 更新用户资料或状态。 */
  update(id: string, input: UserUpdateInput): Promise<UserRecord>;
}
