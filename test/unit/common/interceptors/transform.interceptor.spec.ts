import { of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { TransformInterceptor } from '../../../../src/common/interceptors/transform.interceptor.js';

describe('TransformInterceptor', () => {
  it('sets HTTP success responses to 200 and wraps handler data', async () => {
    const interceptor = new TransformInterceptor<string>();
    const status = vi.fn();
    const result = await new Promise<unknown>((resolve, reject) => {
      interceptor
        .intercept(
          {
            getType: () => 'http',
            switchToHttp: () => ({ getResponse: () => ({ status }) })
          } as never,
          { handle: () => of('ok') }
        )
        .subscribe({ next: resolve, error: reject });
    });

    expect(status).toHaveBeenCalledWith(200);
    expect(result).toEqual({ code: 0, message: 'success', data: 'ok' });
  });

  it('does not access an HTTP response for non-HTTP execution contexts', async () => {
    const interceptor = new TransformInterceptor<string>();
    const result = await new Promise<unknown>((resolve, reject) => {
      interceptor
        .intercept({ getType: () => 'rpc' } as never, {
          handle: () => of('ok')
        })
        .subscribe({ next: resolve, error: reject });
    });

    expect(result).toEqual({ code: 0, message: 'success', data: 'ok' });
  });
});
