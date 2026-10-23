import {
  CanActivate,
  ExecutionContext,
  Injectable,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';

interface RateLimitEntry {
  count: number;
  expiresAt: number;
}

/** 提供进程级基础请求限流，业务接口接入后再细化策略。 */
@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly entries = new Map<string, RateLimitEntry>();

  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const now = Date.now();
    const ttl = this.configService.get<number>('throttler.ttl', 60000);
    const limit = this.configService.get<number>('throttler.limit', 100);
    const key = request.ip ?? 'unknown';
    const current = this.entries.get(key);
    const entry =
      !current || current.expiresAt <= now
        ? { count: 0, expiresAt: now + ttl }
        : current;
    const nextEntry = { count: entry.count + 1, expiresAt: entry.expiresAt };
    this.entries.set(key, nextEntry);
    if (nextEntry.count > limit) {
      throw new HttpException(
        '请求过于频繁，请稍后重试',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    return true;
  }
}
