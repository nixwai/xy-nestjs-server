import { Inject, Injectable, Logger } from '@nestjs/common';
import type { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { parseDuration } from './shared/utils/jwt.util.js';
import { AUTH_SESSION_REPOSITORY } from './admin/repositories/auth-session-repository.port.js';
import type { AuthSessionRepository } from './admin/repositories/auth-session-repository.port.js';
import { USER_AUTH_SESSION_REPOSITORY } from './user/repositories/user-auth-session-repository.port.js';
import type { UserAuthSessionRepository } from './user/repositories/user-auth-session-repository.port.js';

/** 定期删除已失效且超过保留期的刷新令牌会话族。 */
@Injectable()
export class AuthSessionCleanupService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AuthSessionCleanupService.name);
  private readonly cleanupIntervalMs = 60 * 60 * 1000;
  private readonly cleanupBatchSize = 100;
  private cleanupTimer: NodeJS.Timeout | undefined;

  constructor(
    @Inject(AUTH_SESSION_REPOSITORY) private readonly adminSessions: AuthSessionRepository,
    @Inject(USER_AUTH_SESSION_REPOSITORY) private readonly userSessions: UserAuthSessionRepository,
    @Inject(ConfigService) private readonly configService: ConfigService
  ) {}

  /** 启动定时清理并执行一次启动清理。 */
  onModuleInit(): void {
    void this.cleanup();
    this.cleanupTimer = setInterval(() => void this.cleanup(), this.cleanupIntervalMs);
    this.cleanupTimer.unref();
  }

  /** 停止定时清理。 */
  onModuleDestroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }
  }

  private async cleanup(): Promise<void> {
    const now = new Date();
    const retentionSeconds = parseDuration(this.configService.getOrThrow<string>('jwt.refreshTokenExpiresIn'));
    const cutoff = new Date(now.getTime() - retentionSeconds * 1000);
    const results = await Promise.allSettled([
      this.adminSessions.deleteExpiredFamilies(now, cutoff, this.cleanupBatchSize),
      this.userSessions.deleteExpiredFamilies(now, cutoff, this.cleanupBatchSize)
    ]);
    for (const result of results) {
      if (result.status === 'rejected') {
        this.logger.warn(result.reason instanceof Error ? result.reason.message : '刷新令牌会话清理失败');
      }
    }
  }
}
