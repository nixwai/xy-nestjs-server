import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { SecurityModule } from '#/common/security/index.js';
import { AdminModule } from '../admin/admin.module.js';
import { AdminService } from '../admin/admin.service.js';
import { UserModule } from '../user/user.module.js';
import { AdminAuthController } from './admin/admin-auth.controller.js';
import { AdminAuthService } from './admin/admin-auth.service.js';
import { UserAuthController } from './user/user-auth.controller.js';
import { UserAuthService } from './user/user-auth.service.js';
import { JwtTokenService } from './shared/tokens/jwt-token.service.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import type { AuthSessionRepository } from './admin/repositories/auth-session-repository.port.js';
import { AUTH_SESSION_REPOSITORY } from './admin/repositories/auth-session-repository.port.js';
import { UniWechatLoginProvider, WECHAT_LOGIN_PROVIDER } from './user/providers/wechat-login.provider.js';

/** 提供管理端认证、用户端认证、令牌会话和身份校验能力。 */
@Module({
  imports: [AdminModule, UserModule, SecurityModule],
  controllers: [AdminAuthController, UserAuthController],
  providers: [
    Reflector,
    JwtTokenService,
    JwtAuthGuard,
    UserAuthService,
    {
      provide: WECHAT_LOGIN_PROVIDER,
      useClass: UniWechatLoginProvider
    },
    {
      provide: AdminAuthService,
      inject: [AdminService, AUTH_SESSION_REPOSITORY, ConfigService, JwtTokenService],
      useFactory: (
        adminService: AdminService,
        sessionRepository: AuthSessionRepository,
        config: ConfigService,
        jwt: JwtTokenService
      ) => new AdminAuthService(adminService, sessionRepository, config, jwt)
    }
  ],
  exports: [AdminAuthService, UserAuthService, JwtAuthGuard, JwtTokenService]
})
export class AuthModule {}
