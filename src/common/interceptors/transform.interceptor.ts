import type { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import { HttpStatus, Injectable } from '@nestjs/common';
import type { Observable } from 'rxjs';
import { map } from 'rxjs';
import type { Response } from 'express';
import type { ApiResponse } from '../types/index.js';

/** 统一 HTTP 成功状态码并将控制器结果包装为标准响应。 */
@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  /**
   * 将下游处理结果转换为统一成功响应，并将 HTTP 成功状态码固定为 200。
   *
   * @param context - 当前请求执行上下文。
   * @param next - 下游处理器。
   * @returns 包装后的响应流。
   */
  intercept(context: ExecutionContext, next: CallHandler<T>): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((data: T | null) => {
        if (context.getType() === 'http') {
          const response = context.switchToHttp().getResponse<Response>();
          response.status(HttpStatus.OK);
        }

        return {
          code: 0,
          message: 'success',
          data
        };
      })
    );
  }
}
