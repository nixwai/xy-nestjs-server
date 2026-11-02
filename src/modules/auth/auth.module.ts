import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { AdminModule } from '../admin/admin.module.js';
import { AdminService } from '../admin/admin.service.js';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { JwtTokenService } from './tokens/jwt-token.service.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import type { AuthSessionRepository } from './repositories/auth-session-repository.port.js';
import { AUTH_SESSION_REPOSITORY } from './repositories/auth-session-repository.port.js';

/** 提供管理员认证、令牌会话和身份校验能力。 */
@Module({
  imports: [AdminModule],
  controllers: [AuthController],
  providers: [
    Reflector,
    JwtTokenService,
    JwtAuthGuard,
    {
      provide: AuthService,
      inject: [AdminService, AUTH_SESSION_REPOSITORY, ConfigService, JwtTokenService],
      useFactory: (
        adminService: AdminService,
        sessionRepository: AuthSessionRepository,
        config: ConfigService,
        jwt: JwtTokenService
      ) => new AuthService(adminService, sessionRepository, config, jwt)
    }
  ],
  exports: [AuthService, JwtAuthGuard, JwtTokenService]
})
export class AuthModule {}
