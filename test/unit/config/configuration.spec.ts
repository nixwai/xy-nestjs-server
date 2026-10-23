import { describe, expect, it } from 'vitest';
import {
  applyEnvironmentOverrides,
  buildApplicationConfig,
} from '../../../src/config/configuration.js';
import { loadBaseConfig } from '../../../src/common/utils/config.util.js';

describe('application configuration', () => {
  it('maps environment variables into grouped configuration', () => {
    const config = applyEnvironmentOverrides(loadBaseConfig(), {
      NODE_ENV: 'test',
      APP_PORT: '3100',
      CORS_ORIGINS: 'http://localhost:5173,https://admin.example.com',
      DB_ENABLED: 'true',
      JWT_SECRET: 'test-only-secret-with-at-least-32-chars',
      SWAGGER_ENABLED: 'false',
    });

    expect(config).toMatchObject({
      app: { environment: 'test', port: 3100 },
      cors: {
        origins: ['http://localhost:5173', 'https://admin.example.com'],
      },
      database: { enabled: false },
      swagger: { enabled: false },
    });
  });

  it('builds test configuration without a database connection', () => {
    const originalEnvironment = process.env.NODE_ENV;
    const originalSecret = process.env.JWT_SECRET;
    const originalDatabase = process.env.DB_ENABLED;
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = 'test-only-secret-with-at-least-32-chars';
    process.env.DB_ENABLED = 'false';

    try {
      expect(buildApplicationConfig()).toMatchObject({
        app: { environment: 'test' },
        database: { enabled: false },
      });
    } finally {
      if (originalEnvironment === undefined) delete process.env.NODE_ENV;
      else process.env.NODE_ENV = originalEnvironment;
      if (originalSecret === undefined) delete process.env.JWT_SECRET;
      else process.env.JWT_SECRET = originalSecret;
      if (originalDatabase === undefined) delete process.env.DB_ENABLED;
      else process.env.DB_ENABLED = originalDatabase;
    }
  });
});
