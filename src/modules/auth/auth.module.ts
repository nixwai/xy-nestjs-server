import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { AdminModule } from '../admin/admin.module.js';
import { AdminService } from '../admin/admin.service.js';
import { shouldLoadDatabaseModule } from '../../config/configuration.js';
import { AdminSessionEntity } from '../admin/entities/admin-session.entity.js';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { JwtTokenService } from './tokens/jwt-token.service.js';
import { AUTH_SESSION_REPOSITORY } from './repositories/auth-session-repository.port.js';
import type { AuthSessionRepository } from './repositories/auth-session-repository.port.js';
import { InMemoryAuthSessionRepository } from './repositories/in-memory-auth-session.repository.js';
import { TypeOrmAuthSessionRepository } from './repositories/typeorm-auth-session.repository.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';

const databaseEnabled = shouldLoadDatabaseModule();

/** 提供管理员认证、令牌会话和身份校验能力。 */
@Module({
  imports: [
    AdminModule,
    ...(databaseEnabled
      ? [TypeOrmModule.forFeature([AdminSessionEntity])]
      : []),
  ],
  controllers: [AuthController],
  providers: [
    Reflector,
    JwtTokenService,
    JwtAuthGuard,
    {
      provide: AUTH_SESSION_REPOSITORY,
      useClass: databaseEnabled
        ? TypeOrmAuthSessionRepository
        : InMemoryAuthSessionRepository,
    },
    {
      provide: AuthService,
      inject: [
        AdminService,
        AUTH_SESSION_REPOSITORY,
        ConfigService,
        JwtTokenService,
      ],
      useFactory: (
        adminService: AdminService,
        sessionRepository: AuthSessionRepository,
        config: ConfigService,
        jwt: JwtTokenService,
      ) => new AuthService(adminService, sessionRepository, config, jwt),
    },
  ],
  exports: [
    AuthService,
    JwtAuthGuard,
    JwtTokenService,
    AUTH_SESSION_REPOSITORY,
  ],
})
export class AuthModule {}
