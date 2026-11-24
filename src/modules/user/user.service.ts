import { BadRequestException, Inject, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { omitUndefined } from '#/common/utils/index.js';
import { AuditService } from '../audit/audit.service.js';
import { USER_REPOSITORY } from './repositories/user-repository.port.js';
import type { UserRepository } from './repositories/user-repository.port.js';
import { UserListQueryDto, type UserUpdateRequestDto } from './dto/index.js';
import type {
  UserAdminRecord,
  UserCreateInput,
  UserProfileRecord,
  UserRecord,
  UserUpdateInput,
  UserWechatIdentityInput
} from './types/user.types.js';
import type { PageResult } from '#/common/types/index.js';

/** 微信用户应用服务。 */
@Injectable()
export class UserService {
  /** 创建当前实例。 */
  constructor(
    @Inject(USER_REPOSITORY) private readonly repository: UserRepository,
    @Inject(AuditService) private readonly auditService: AuditService
  ) {}

  /** 按主键查询用户。 */
  findById(id: string): Promise<UserRecord | null> {
    return this.repository.findById(id);
  }

  /** 查询当前仍可用的用户，不可用时按认证失败处理。 */
  async findActiveUser(id: string): Promise<UserRecord> {
    const user = await this.repository.findById(id);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('登录状态无效');
    }
    return user;
  }

  /** 查询后台用户列表。 */
  async listUsers(query: UserListQueryDto = new UserListQueryDto()): Promise<PageResult<UserAdminRecord>> {
    const result = await this.repository.list(query);
    return {
      ...result,
      items: result.items.map(item => this.toAdminRecord(item))
    };
  }

  /** 查询小程序个人资料。 */
  async getProfile(id: string): Promise<UserProfileRecord> {
    const user = await this.repository.findById(id);
    if (!user) {
      throw new NotFoundException('用户不存在');
    }
    return this.toProfileRecord(user);
  }

  /** 创建用户，可不绑定外部登录身份。 */
  createUser(input: UserCreateInput): Promise<UserRecord> {
    return this.repository.create(input);
  }

  /** 根据微信身份幂等创建或更新用户。 */
  async upsertWechatUser(input: UserWechatIdentityInput): Promise<UserRecord> {
    const existing = await this.repository.findByOpenId(input.openId);
    if (existing && !existing.isActive) {
      throw new UnauthorizedException('用户已被停用');
    }
    return this.repository.upsertByWechatIdentity(input);
  }

  /** 更新后台用户资料或状态。 */
  async updateUser(actorId: string, body: UserUpdateRequestDto): Promise<UserAdminRecord> {
    const current = await this.repository.findById(body.id);
    if (!current) {
      throw new NotFoundException('用户不存在');
    }

    const input: UserUpdateInput = omitUndefined({
      nickname: body.nickname === undefined ? undefined : this.normalizeNullableText(body.nickname),
      avatarUrl: body.avatarUrl === undefined ? undefined : this.normalizeNullableText(body.avatarUrl),
      isActive: body.isActive
    });
    if (!Object.keys(input).length) {
      throw new BadRequestException('至少需要更新一个用户字段');
    }

    const updated = await this.repository.update(body.id, input);
    await this.auditService.record({
      actorAdminId: actorId,
      action: 'user.update',
      resourceType: 'user',
      targetId: body.id,
      details: { changes: Object.keys(input) }
    });
    return this.toAdminRecord(updated);
  }

  /** 将用户记录映射为后台公开结构。 */
  private toAdminRecord(user: UserRecord): UserAdminRecord {
    return {
      id: user.id,
      openId: user.openId,
      unionId: user.unionId,
      nickname: user.nickname,
      avatarUrl: user.avatarUrl,
      isActive: user.isActive,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
  }

  /** 将用户记录映射为个人页公开结构。 */
  private toProfileRecord(user: UserRecord): UserProfileRecord {
    return {
      id: user.id,
      nickname: user.nickname,
      avatarUrl: user.avatarUrl,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
  }

  /** 将可编辑文本归一化为空值或去除首尾空白。 */
  private normalizeNullableText(value: string | null): string | null {
    if (value === null) {
      return null;
    }
    const normalized = value.trim();
    return normalized || null;
  }
}
