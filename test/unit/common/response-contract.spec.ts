import { of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { TransformInterceptor } from '#/common/interceptors/transform.interceptor.js';

describe('统一成功响应拦截器', () => {
  it('HTTP 请求固定返回 200 并包装 data', async () => {
    const interceptor = new TransformInterceptor<string>();
    const status = vi.fn();
    const result = await new Promise<unknown>((resolve, reject) => {
      interceptor
        .intercept({ getType: () => 'http', switchToHttp: () => ({ getResponse: () => ({ status }) }) } as never, {
          handle: () => of('ok')
        })
        .subscribe({ next: resolve, error: reject });
    });
    expect(status).toHaveBeenCalledWith(200);
    expect(result).toEqual({ code: 0, message: 'success', data: 'ok' });
  });

  it('非 HTTP 上下文不访问 HTTP 响应对象', async () => {
    const interceptor = new TransformInterceptor<string>();
    const result = await new Promise<unknown>((resolve, reject) => {
      interceptor
        .intercept({ getType: () => 'rpc' } as never, { handle: () => of('ok') })
        .subscribe({ next: resolve, error: reject });
    });
    expect(result).toEqual({ code: 0, message: 'success', data: 'ok' });
  });
});
