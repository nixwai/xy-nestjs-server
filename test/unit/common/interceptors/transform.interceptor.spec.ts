import { of } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { TransformInterceptor } from '../../../../src/common/interceptors/transform.interceptor.js';

describe('TransformInterceptor', () => {
  it('wraps handler data in the standard response envelope', async () => {
    const interceptor = new TransformInterceptor<string>();
    const result = await new Promise<unknown>((resolve, reject) => {
      interceptor
        .intercept({} as never, { handle: () => of('ok') })
        .subscribe({ next: resolve, error: reject });
    });

    expect(result).toEqual({ code: 0, message: 'success', data: 'ok' });
  });
});
