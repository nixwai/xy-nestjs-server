import { Inject, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { addSeconds } from '#/common/utils/index.js';
import { parseDuration } from '../shared/utils/jwt.util.js';
import { createRefreshToken, hashRefreshToken } from '../shared/utils/refresh-token.util.js';
import { JwtTokenService } from '../shared/tokens/jwt-token.service.js';
import type { UserAuthSessionRepository } from './repositories/user-auth-session-repository.port.js';
import { USER_AUTH_SESSION_REPOSITORY } from './repositories/user-auth-session-repository.port.js';
import type { UserAuthTokenResponseDto } from './dto/index.js';
import { UserService } from '../../user/user.service.js';
import type { WechatLoginProvider } from './providers/wechat-login.provider.js';
import { WECHAT_LOGIN_PROVIDER } from './providers/wechat-login.provider.js';

/** 微信用户认证业务服务。 */
@Injectable()
export class UserAuthService {
  /** 创建当前实例。 */
  constructor(
    @Inject(UserService) private readonly userService: UserService,
    @Inject(USER_AUTH_SESSION_REPOSITORY) private readonly sessionRepository: UserAuthSessionRepository,
    @Inject(ConfigService) private readonly configService: ConfigService,
    @Inject(JwtTokenService) private readonly jwtTokenService: JwtTokenService,
    @Inject(WECHAT_LOGIN_PROVIDER) private readonly wechatLoginProvider: WechatLoginProvider
  ) {}

  /** 使用 uni.login 返回的微信 code 登录或注册用户。 */
  async login(code: string, nickname?: string, avatarUrl?: string): Promise<UserAuthTokenResponseDto> {
    const identity = await this.wechatLoginProvider.exchangeCode(code);
    const user = await this.userService.upsertWechatUser({
      openId: identity.openId,
      unionId: identity.unionId,
      nickname: this.normalizeOptionalText(nickname),
      avatarUrl: this.normalizeOptionalText(avatarUrl),
      lastLoginAt: new Date()
    });
    if (!user.isActive) {
      throw new UnauthorizedException('用户已被停用');
    }
    return this.issueTokens(user);
  }

  /** 仅在开发环境创建不绑定微信身份的测试用户并登录。 */
  async loginForDevelopment(nickname?: string): Promise<UserAuthTokenResponseDto> {
    this.ensureDevelopmentEnvironment();
    const user = await this.userService.createUser({
      openId: null,
      unionId: null,
      nickname: this.normalizeOptionalText(nickname) ?? 'H5开发用户',
      lastLoginAt: new Date()
    });
    return this.issueTokens(user);
  }

  /** 使用用户 Refresh Token 轮换会话令牌。 */
  async refresh(refreshToken: string): Promise<UserAuthTokenResponseDto> {
    const current = await this.sessionRepository.findByTokenHash(hashRefreshToken(refreshToken));
    if (!current) {
      throw new UnauthorizedException('刷新令牌无效');
    }
    const user = await this.userService.findById(current.userId);
    if (!user || !user.isActive) {
      await this.sessionRepository.revokeChain(current.id, new Date());
      throw new UnauthorizedException('刷新令牌无效');
    }
    const now = new Date();
    const next = createRefreshToken();
    const rotation = await this.sessionRepository.rotate(
      current.id,
      {
        userId: user.id,
        tokenHash: hashRefreshToken(next),
        expiresAt: addSeconds(now, this.refreshTokenExpiresIn)
      },
      now
    );
    if (rotation.status === 'rotated') {
      return this.buildTokenResponse(user, next);
    }
    if (rotation.status === 'replayed') {
      await this.sessionRepository.revokeChain(current.id, now);
    }
    throw new UnauthorizedException('刷新令牌无效');
  }

  /** 撤销用户 Refresh Token。 */
  async logout(refreshToken: string): Promise<null> {
    await this.sessionRepository.revokeByTokenHash(hashRefreshToken(refreshToken), new Date());
    return null;
  }

  /** 创建用户登录会话并返回令牌。 */
  private async issueTokens(user: {
    id: string;
    nickname: string | null;
    avatarUrl: string | null;
  }): Promise<UserAuthTokenResponseDto> {
    const refreshToken = createRefreshToken();
    await this.sessionRepository.create({
      userId: user.id,
      tokenHash: hashRefreshToken(refreshToken),
      expiresAt: addSeconds(new Date(), this.refreshTokenExpiresIn)
    });
    return this.buildTokenResponse(user, refreshToken);
  }

  /** 构造用户令牌响应。 */
  private buildTokenResponse(
    user: { id: string; nickname: string | null; avatarUrl: string | null },
    refreshToken: string
  ): UserAuthTokenResponseDto {
    return {
      accessToken: this.jwtTokenService.signAccessToken(user.id, 'user'),
      refreshToken,
      tokenType: 'Bearer',
      accessTokenExpiresIn: this.accessTokenExpiresIn,
      refreshTokenExpiresIn: this.refreshTokenExpiresIn,
      user: {
        id: user.id,
        nickname: user.nickname,
        avatarUrl: user.avatarUrl,
        role: 'user'
      }
    };
  }

  /** 拒绝非开发环境调用开发登录接口。 */
  private ensureDevelopmentEnvironment(): void {
    const environment = this.configService.getOrThrow<string>('app.environment');
    if (environment !== 'development') {
      throw new NotFoundException('接口不存在');
    }
  }

  /** 将可选展示字段归一化为空值或未提供。 */
  private normalizeOptionalText(value: string | undefined): string | undefined {
    const normalized = value?.trim();
    return normalized || undefined;
  }

  /** 获取访问令牌有效期。 */
  private get accessTokenExpiresIn(): number {
    return parseDuration(this.configService.getOrThrow<string>('jwt.accessTokenExpiresIn'));
  }

  /** 获取刷新令牌有效期。 */
  private get refreshTokenExpiresIn(): number {
    return parseDuration(this.configService.getOrThrow<string>('jwt.refreshTokenExpiresIn'));
  }
}
