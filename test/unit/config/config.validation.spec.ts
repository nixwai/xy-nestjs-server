import { describe, expect, it } from 'vitest';
import {
  createApplicationConfigSchema,
  createConfigValidationSchema,
  validateEnvironment,
} from '../../../src/config/config.validation.js';

describe('config validation', () => {
  it('rejects a missing JWT secret', () => {
    const { error } = createConfigValidationSchema().validate({
      NODE_ENV: 'development',
    });
    expect(error).toBeDefined();
  });

  it('rejects an invalid environment', () => {
    const { error } = createConfigValidationSchema().validate({
      NODE_ENV: 'invalid',
      JWT_SECRET: 'test-only-secret-with-at-least-32-chars',
    });
    expect(error).toBeDefined();
  });

  it('normalizes a valid test environment', () => {
    expect(
      validateEnvironment({
        NODE_ENV: 'test',
        DB_ENABLED: 'false',
        JWT_SECRET: 'test-only-secret-with-at-least-32-chars',
      }),
    ).toMatchObject({ NODE_ENV: 'test', DB_ENABLED: false });
  });

  it('rejects disabled databases outside test', () => {
    expect(() =>
      validateEnvironment({
        NODE_ENV: 'development',
        DB_ENABLED: 'false',
        JWT_SECRET: 'test-only-secret-with-at-least-32-chars',
      }),
    ).toThrow('开发和生产环境必须显式启用数据库');
  });

  it('rejects production defaults and incomplete database settings', () => {
    expect(() =>
      validateEnvironment({
        NODE_ENV: 'production',
        DB_ENABLED: 'true',
        JWT_SECRET: 'test-only-secret-with-at-least-32-chars',
      }),
    ).toThrow('生产环境缺少数据库配置');
  });

  it('rejects a weak production secret in a complete configuration', () => {
    const { error } = createConfigValidationSchema().validate({
      NODE_ENV: 'production',
      DB_ENABLED: true,
      DB_HOST: 'mysql.internal',
      DB_PORT: 3306,
      DB_USERNAME: 'app',
      DB_PASSWORD: 'strong-password',
      DB_DATABASE: 'scenic_booking',
      JWT_SECRET: 'test-only-secret-with-at-least-32-chars',
    });
    expect(error).toBeDefined();
  });

  it('rejects enabled integrations without credentials', () => {
    const config = {
      app: { environment: 'development', port: 3000, globalPrefix: 'api' },
      cors: { origins: [] },
      database: {
        enabled: true,
        host: 'localhost',
        port: 3306,
        username: 'root',
        password: 'password',
        database: 'scenic_booking',
        synchronize: false,
      },
      jwt: {
        secret: 'test-only-secret-with-at-least-32-chars',
        accessTokenExpiresIn: '15m',
        refreshTokenExpiresIn: '7d',
      },
      swagger: { enabled: true, path: 'docs' },
      storage: {
        enabled: true,
        region: '',
        bucket: '',
        secretId: '',
        secretKey: '',
      },
      wechat: { enabled: false, appId: '', appSecret: '' },
      throttler: { ttl: 60000, limit: 100 },
      api: { versionHeader: 'application/vnd.scenic.v1+json' },
    };
    expect(
      createApplicationConfigSchema().validate(config).error,
    ).toBeDefined();
  });
});
