import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { ConfigService } from '@nestjs/config';
import { addSeconds, hashPassword, validatePassword, verifyPassword } from '#/common/utils/index.js';
import { parseDuration } from '../shared/utils/jwt.util.js';
import { createRefreshToken, hashRefreshToken } from '../shared/utils/refresh-token.util.js';
import { JwtTokenService } from '../shared/tokens/jwt-token.service.js';
import { RefreshTokenInvalidException } from '../shared/errors/index.js';
import type { AdminRecord } from '../../admin/types/admin.types.js';
import { AdminService } from '../../admin/admin.service.js';
import type { AuthSessionRepository } from './repositories/auth-session-repository.port.js';
import type { AuthTokenResponseDto } from './dto/index.js';
/** 管理员认证业务服务。 */
@Injectable()
export class AdminAuthService {
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
      throw new RefreshTokenInvalidException();
    }
    const admin = await this.findAdminById(current.adminId);
    if (!admin || !admin.isActive) {
      await this.sessionRepository.revokeBySessionFamilyId(current.sessionFamilyId, new Date());
      throw new RefreshTokenInvalidException();
    }
    const now = new Date();
    const next = createRefreshToken();
    const rotation = await this.sessionRepository.rotate(
      current.id,
      {
        adminId: admin.id,
        sessionFamilyId: current.sessionFamilyId,
        tokenHash: hashRefreshToken(next),
        expiresAt: addSeconds(now, this.refreshTokenExpiresIn)
      },
      now
    );
    if (rotation.status === 'rotated') {
      return this.buildTokenResponse(admin, next);
    }

    if (rotation.status === 'replayed') {
      await this.sessionRepository.revokeBySessionFamilyId(current.sessionFamilyId, now);
    }
    throw new RefreshTokenInvalidException();
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
      sessionFamilyId: randomUUID(),
      tokenHash: hashRefreshToken(refreshToken),
      expiresAt: addSeconds(new Date(), this.refreshTokenExpiresIn)
    });
    return this.buildTokenResponse(admin, refreshToken);
  }
  /** buildTokenResponse。 */
  private buildTokenResponse(admin: AdminRecord, refreshToken: string): AuthTokenResponseDto {
    return {
      accessToken: this.jwtTokenService.signAccessToken(admin.id, 'admin'),
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
