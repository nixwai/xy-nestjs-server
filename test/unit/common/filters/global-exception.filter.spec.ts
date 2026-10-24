import { ArgumentsHost, Logger } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { GlobalExceptionFilter } from '../../../../src/common/filters/global-exception.filter.js';

function hostFor(url: string): ArgumentsHost {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ method: 'GET', url, path: '/api/health' }),
      getResponse: () => ({
        status: () => ({ json: () => undefined }),
        json: () => undefined,
      }),
    }),
  } as unknown as ArgumentsHost;
}

describe('GlobalExceptionFilter', () => {
  it('does not log query parameters with the request context', () => {
    const loggerSpy = vi
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);

    new GlobalExceptionFilter().catch(
      new Error('internal failure'),
      hostFor('/api/health?access_token=secret'),
    );

    expect(loggerSpy).toHaveBeenCalledWith(
      'GET /api/health',
      expect.anything(),
    );
    expect(loggerSpy).not.toHaveBeenCalledWith(
      expect.stringContaining('access_token=secret'),
      expect.anything(),
    );
    loggerSpy.mockRestore();
  });
});
