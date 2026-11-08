import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { addSeconds, validatePassword } from '#/common/utils/index.js';
import { hashPassword, verifyPassword } from './utils/password.util.js';
import { parseDuration } from './utils/jwt.util.js';
import { createRefreshToken, hashRefreshToken } from './utils/refresh-token.util.js';
import { JwtTokenService } from './tokens/jwt-token.service.js';
import type { AdminRecord } from '../admin/types/admin.types.js';
import { AdminService } from '../admin/admin.service.js';
import type { AuthSessionRepository } from './repositories/auth-session-repository.port.js';
import type { AuthTokenResponseDto } from './dto/index.js';
/** 管理员认证业务服务。 */
@Injectable()
export class AuthService {
  /** 创建当前实例。 */
  constructor(
    @Inject(AdminService) private readonly adminService: AdminService,
    private readonly sessionRepository: AuthSessionRepository,
    @Inject(ConfigService) private readonly configService: ConfigService,
    @Inject(JwtTokenService) private readonly jwtTokenService: JwtTokenService
  ) {}
  /** 校验管理员凭据并创建登录会话。 */
  async login(username: string, password: string): Promise<AuthTokenResponseDto> {
    const admin = await this.findAdminByUsername(username);
    if (!admin || !admin.isActive) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    const passwordValid = await verifyPassword(password, admin.passwordHash, admin.passwordSalt);
    if (!passwordValid) {
      throw new UnauthorizedException('用户名或密码错误');
    }
    return this.issueTokens(admin);
  }
  /** 使用 Refresh Token 轮换管理员会话。 */
  async refresh(refreshToken: string): Promise<AuthTokenResponseDto> {
    const current = await this.sessionRepository.findByTokenHash(hashRefreshToken(refreshToken));
    if (!current) {
      throw new UnauthorizedException('刷新令牌无效');
    }
    const admin = await this.findAdminById(current.adminId);
    if (!admin || !admin.isActive) {
      await this.sessionRepository.revokeChain(current.id, new Date());
      throw new UnauthorizedException('刷新令牌无效');
    }
    const now = new Date();
    const next = createRefreshToken();
    const rotation = await this.sessionRepository.rotate(
      current.id,
      {
        adminId: admin.id,
        tokenHash: hashRefreshToken(next),
        expiresAt: addSeconds(now, this.refreshTokenExpiresIn)
      },
      now
    );
    if (rotation.status === 'rotated') {
      return this.buildTokenResponse(admin, next);
    }

    if (rotation.status === 'replayed') {
      await this.sessionRepository.revokeChain(current.id, now);
    }
    throw new UnauthorizedException('刷新令牌无效');
  }
  /** 撤销 Refresh Token。 */
  async logout(refreshToken: string): Promise<null> {
    await this.sessionRepository.revokeByTokenHash(hashRefreshToken(refreshToken), new Date());
    return null;
  }
  /** 创建首个根管理员。 */
  async createInitialAdmin(username: string, password: string): Promise<AdminRecord> {
    validatePassword(password);
    const { hash, salt } = await hashPassword(password);
    return this.adminService.createInitialAdmin({
      username,
      passwordHash: hash,
      passwordSalt: salt
    });
  }
  /** 校验管理员身份是否仍然可用。 */
  async findActiveAdmin(adminId: string): Promise<AdminRecord> {
    const admin = await this.findAdminById(adminId);
    if (!admin || !admin.isActive) {
      throw new UnauthorizedException('登录状态无效');
    }
    return admin;
  }
  /** 验证管理员当前密码。 */
  async verifyAdminPassword(adminId: string, password: string): Promise<boolean> {
    const admin = await this.findAdminById(adminId);
    return Boolean(admin && (await verifyPassword(password, admin.passwordHash, admin.passwordSalt)));
  }
  /** findAdminByUsername。 */
  private async findAdminByUsername(username: string): Promise<AdminRecord | null> {
    return this.adminService.findByUsername(username);
  }
  /** findAdminById。 */
  private async findAdminById(id: string): Promise<AdminRecord | null> {
    return this.adminService.findById(id);
  }
  /** issueTokens。 */
  private async issueTokens(admin: AdminRecord): Promise<AuthTokenResponseDto> {
    const refreshToken = createRefreshToken();
    await this.sessionRepository.create({
      adminId: admin.id,
      tokenHash: hashRefreshToken(refreshToken),
      expiresAt: addSeconds(new Date(), this.refreshTokenExpiresIn)
    });
    return this.buildTokenResponse(admin, refreshToken);
  }
  /** buildTokenResponse。 */
  private buildTokenResponse(admin: AdminRecord, refreshToken: string): AuthTokenResponseDto {
    return {
      accessToken: this.jwtTokenService.signAccessToken(admin.id),
      refreshToken,
      tokenType: 'Bearer',
      accessTokenExpiresIn: this.accessTokenExpiresIn,
      refreshTokenExpiresIn: this.refreshTokenExpiresIn,
      admin: {
        id: admin.id,
        username: admin.username,
        isRoot: admin.isRoot,
        role: 'admin'
      }
    };
  }
  /** 获取accessTokenExpiresIn。 */
  private get accessTokenExpiresIn(): number {
    return parseDuration(this.configService.getOrThrow<string>('jwt.accessTokenExpiresIn'));
  }
  /** 获取refreshTokenExpiresIn。 */
  private get refreshTokenExpiresIn(): number {
    return parseDuration(this.configService.getOrThrow<string>('jwt.refreshTokenExpiresIn'));
  }
}
