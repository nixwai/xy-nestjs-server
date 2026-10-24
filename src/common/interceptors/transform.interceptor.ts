import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';
import type { ApiResponse } from '../types/index.js';

/** 将控制器返回值包装为统一成功响应。 */
@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<
  T,
  ApiResponse<T>
> {
  /**
   * 将下游处理结果转换为统一成功响应。
   *
   * @param _context - 当前请求执行上下文。
   * @param next - 下游处理器。
   * @returns 包装后的响应流。
   */
  intercept(
    _context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((data: T | null) => ({
        code: 0,
        message: 'success',
        data,
      })),
    );
  }
}
