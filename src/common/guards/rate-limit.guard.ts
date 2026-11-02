import type { CanActivate, ExecutionContext } from '@nestjs/common';
import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';

/** 单个客户端的限流计数记录。 */
interface RateLimitEntry {
  /** 当前时间窗口内的请求数。 */
  count: number;

  /** 当前时间窗口的到期时间戳。 */
  expiresAt: number;
}

/** 按客户端 IP 在进程内限制请求频率。 */
@Injectable()
export class RateLimitGuard implements CanActivate {
  /** 保存各客户端当前时间窗口的请求计数。 */
  private readonly entries = new Map<string, RateLimitEntry>();
  /** 上一次清理过期记录的时间戳。 */
  private lastCleanupAt = 0;

  /** 清理过期记录的最短间隔。 */
  private readonly cleanupIntervalMs = 60_000;

  constructor(
    /** 读取限流窗口和请求上限配置。 */
    @Inject(ConfigService) private readonly configService: ConfigService
  ) {}

  /**
   * 检查客户端是否超过请求频率限制，并记录本次请求。
   *
   * @param context - 当前请求执行上下文。
   * @returns 请求是否允许继续处理。
   * @throws 当客户端超过当前时间窗口的请求上限时抛出异常。
   */
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const now = Date.now();
    const ttl = this.configService.get<number>('throttler.ttl', 60000);
    const limit = this.configService.get<number>('throttler.limit', 100);
    const key = request.ip ?? 'unknown';
    if (now - this.lastCleanupAt >= this.cleanupIntervalMs) {
      this.removeExpiredEntries(now);
      this.lastCleanupAt = now;
    }

    const current = this.entries.get(key);
    const entry = this.createEntry(current, now, ttl);
    const nextEntry = { count: entry.count + 1, expiresAt: entry.expiresAt };
    this.entries.set(key, nextEntry);

    if (nextEntry.count <= limit) {
      return true;
    }

    throw new HttpException('请求过于频繁，请稍后重试', HttpStatus.TOO_MANY_REQUESTS);
  }

  /** 创建当前时间窗口的计数记录。 */
  private createEntry(current: RateLimitEntry | undefined, now: number, ttl: number): RateLimitEntry {
    if (!current || current.expiresAt <= now) {
      return { count: 0, expiresAt: now + ttl };
    }

    return current;
  }

  /** 删除已经过期的客户端限流记录。 */
  private removeExpiredEntries(now: number): void {
    for (const [entryKey, entry] of this.entries) {
      if (entry.expiresAt <= now) {
        this.entries.delete(entryKey);
      }
    }
  }
}
