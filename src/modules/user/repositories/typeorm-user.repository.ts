import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import { DomainConflictError, DomainNotFoundError } from '#/common/errors/index.js';
import type { PageResult } from '#/common/types/index.js';
import type { UserRepository } from './user-repository.port.js';
import { UserEntity } from '../entities/user.entity.js';
import type { UserCreateInput, UserRecord, UserUpdateInput, UserWechatIdentityInput } from '../types/user.types.js';

/** 使用 TypeORM 保存微信用户。 */
@Injectable()
export class TypeOrmUserRepository implements UserRepository {
  /** 创建当前实例。 */
  constructor(@InjectRepository(UserEntity) private readonly users: Repository<UserEntity>) {}

  /** 按主键查询用户。 */
  async findById(id: string): Promise<UserRecord | null> {
    const item = await this.users.findOne({ where: { id } });
    return item ? this.toRecord(item) : null;
  }

  /** 按微信 openId 查询用户。 */
  async findByOpenId(openId: string): Promise<UserRecord | null> {
    const item = await this.users.findOne({ where: { openId } });
    return item ? this.toRecord(item) : null;
  }

  /** 按条件分页查询用户。 */
  async list(query: {
    page: number;
    pageSize: number;
    skip: number;
    keyword?: string;
    isActive?: boolean;
  }): Promise<PageResult<UserRecord>> {
    const page = Number(query.page) || 1;
    const pageSize = Number(query.pageSize) || 20;
    const skip = (page - 1) * pageSize;
    const builder = this.users
      .createQueryBuilder('user')
      .orderBy('user.createdAt', 'DESC')
      .addOrderBy('user.id', 'DESC')
      .skip(skip)
      .take(pageSize);

    const keyword = query.keyword?.trim();
    if (keyword) {
      builder.andWhere(
        '(user.id LIKE :keyword OR user.openId LIKE :keyword OR user.unionId LIKE :keyword OR user.nickname LIKE :keyword)',
        { keyword: `%${keyword}%` }
      );
    }
    if (query.isActive !== undefined) {
      builder.andWhere('user.isActive = :isActive', { isActive: query.isActive });
    }

    const [items, total] = await builder.getManyAndCount();
    const totalPages = total === 0 ? 0 : Math.ceil(total / pageSize);
    return {
      items: items.map(item => this.toRecord(item)),
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
    const item = await this.users.save(
      this.users.create({
        openId: input.openId ?? null,
        unionId: input.unionId ?? null,
        nickname: input.nickname ?? null,
        avatarUrl: input.avatarUrl ?? null,
        isActive: input.isActive ?? true,
        lastLoginAt: input.lastLoginAt ?? null,
        deletedAt: null
      })
    );
    return this.toRecord(item);
  }

  /** 按微信身份幂等创建或更新用户。 */
  async upsertByWechatIdentity(input: UserWechatIdentityInput): Promise<UserRecord> {
    const current = await this.findByOpenId(input.openId);
    if (current) {
      return this.update(current.id, {
        unionId: input.unionId ?? current.unionId,
        nickname: input.nickname ?? current.nickname,
        avatarUrl: input.avatarUrl ?? current.avatarUrl,
        lastLoginAt: input.lastLoginAt ?? new Date()
      });
    }

    try {
      return await this.create({
        ...input,
        lastLoginAt: input.lastLoginAt ?? new Date()
      });
    } catch (error: unknown) {
      if (!this.isDuplicate(error)) {
        throw error;
      }
      const retry = await this.findByOpenId(input.openId);
      if (!retry) {
        throw new DomainConflictError('微信用户身份');
      }
      return this.update(retry.id, {
        unionId: input.unionId ?? retry.unionId,
        nickname: input.nickname ?? retry.nickname,
        avatarUrl: input.avatarUrl ?? retry.avatarUrl,
        lastLoginAt: input.lastLoginAt ?? new Date()
      });
    }
  }

  /** 更新用户资料或状态。 */
  async update(id: string, input: UserUpdateInput): Promise<UserRecord> {
    const item = await this.findEntityOrThrow(id);
    this.users.merge(item, input);
    return this.toRecord(await this.users.save(item));
  }

  /** 查询实体并校验存在。 */
  private async findEntityOrThrow(id: string): Promise<UserEntity> {
    const item = await this.users.findOne({ where: { id } });
    if (!item) {
      throw new DomainNotFoundError('用户');
    }
    return item;
  }

  /** 将实体转换为领域记录。 */
  private toRecord(item: UserEntity): UserRecord {
    return {
      id: String(item.id),
      openId: item.openId,
      unionId: item.unionId,
      nickname: item.nickname,
      avatarUrl: item.avatarUrl,
      isActive: item.isActive,
      lastLoginAt: item.lastLoginAt,
      deletedAt: item.deletedAt,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt
    };
  }

  /** 判断是否为微信身份唯一键冲突。 */
  private isDuplicate(error: unknown): boolean {
    return typeof error === 'object' && error !== null && 'code' in error && error.code === 'ER_DUP_ENTRY';
  }
}
