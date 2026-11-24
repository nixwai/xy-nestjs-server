import { DomainNotFoundError } from '#/common/errors/index.js';
import type { PageResult } from '#/common/types/index.js';
import { PageQueryDto } from '#/common/dto/index.js';
import type { UserRepository } from './user-repository.port.js';
import type { UserCreateInput, UserRecord, UserUpdateInput, UserWechatIdentityInput } from '../types/user.types.js';

/** 在无数据库测试环境中保存用户。 */
export class InMemoryUserRepository implements UserRepository {
  /** 内存中的用户记录。 */
  private readonly users = new Map<string, UserRecord>();
  /** 下一个可分配的内存记录标识。 */
  private nextId = 1;

  /** 按主键查询用户。 */
  async findById(id: string): Promise<UserRecord | null> {
    const item = this.users.get(id);
    return item && item.deletedAt === null ? { ...item } : null;
  }

  /** 按微信 openId 查询用户。 */
  async findByOpenId(openId: string): Promise<UserRecord | null> {
    const item = [...this.users.values()].find(record => record.deletedAt === null && record.openId === openId);
    return item ? { ...item } : null;
  }

  /** 按条件分页查询用户。 */
  async list(
    query: PageQueryDto & {
      id?: string;
      openId?: string;
      unionId?: string;
      nickname?: string;
      isActive?: boolean;
    } = new PageQueryDto()
  ): Promise<PageResult<UserRecord>> {
    const page = Number(query.page) || 1;
    const pageSize = Number(query.pageSize) || 20;
    const skip = (page - 1) * pageSize;
    const id = query.id?.trim().toLocaleLowerCase();
    const openId = query.openId?.trim().toLocaleLowerCase();
    const unionId = query.unionId?.trim().toLocaleLowerCase();
    const nickname = query.nickname?.trim().toLocaleLowerCase();
    const items = [...this.users.values()]
      .filter(item => item.deletedAt === null)
      .filter(item => query.isActive === undefined || item.isActive === query.isActive)
      .filter(item => !id || item.id.toLocaleLowerCase().includes(id))
      .filter(item => !openId || item.openId?.toLocaleLowerCase().includes(openId) === true)
      .filter(item => !unionId || item.unionId?.toLocaleLowerCase().includes(unionId) === true)
      .filter(item => !nickname || item.nickname?.toLocaleLowerCase().includes(nickname) === true)
      .sort((left, right) => Number(BigInt(right.id) - BigInt(left.id)));
    const total = items.length;
    const totalPages = total === 0 ? 0 : Math.ceil(total / pageSize);
    return {
      items: items.slice(skip, skip + pageSize).map(item => ({ ...item })),
      total,
      page,
      pageSize,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1 && total > 0
    };
  }

  /** 创建用户，可不绑定外部登录身份。 */
  async create(input: UserCreateInput): Promise<UserRecord> {
    const now = new Date();
    const item: UserRecord = {
      id: String(this.nextId++),
      openId: input.openId ?? null,
      unionId: input.unionId ?? null,
      nickname: input.nickname ?? null,
      avatarUrl: input.avatarUrl ?? null,
      isActive: input.isActive ?? true,
      lastLoginAt: input.lastLoginAt ?? null,
      deletedAt: null,
      createdAt: now,
      updatedAt: now
    };
    this.users.set(item.id, item);
    return { ...item };
  }

  /** 按微信身份幂等创建或更新用户。 */
  async upsertByWechatIdentity(input: UserWechatIdentityInput): Promise<UserRecord> {
    const existing = await this.findByOpenId(input.openId);
    if (existing) {
      return this.update(existing.id, {
        unionId: input.unionId ?? existing.unionId,
        nickname: input.nickname ?? existing.nickname,
        avatarUrl: input.avatarUrl ?? existing.avatarUrl,
        lastLoginAt: input.lastLoginAt ?? new Date()
      });
    }

    return this.create({
      ...input,
      lastLoginAt: input.lastLoginAt ?? new Date()
    });
  }

  /** 更新用户资料或状态。 */
  async update(id: string, input: UserUpdateInput): Promise<UserRecord> {
    const item = await this.findByIdOrThrow(id);
    const updated = { ...item, ...input, updatedAt: new Date() };
    this.users.set(id, updated);
    return { ...updated };
  }

  /** 查询并校验用户存在。 */
  private async findByIdOrThrow(id: string): Promise<UserRecord> {
    const item = await this.findById(id);
    if (!item) {
      throw new DomainNotFoundError('用户');
    }
    return item;
  }
}
