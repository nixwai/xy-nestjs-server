import { TEST_RSA_PRIVATE_KEY } from '../../fixtures/rsa-key.js';
import { describe, expect, it } from 'vitest';
import {
  createApplicationConfigSchema,
  createConfigValidationSchema,
  validateEnvironment
} from '#/config/config.validation.js';

describe('config validation', () => {
  it('rejects a missing RSA private key', () => {
    const { error } = createConfigValidationSchema().validate({
      NODE_ENV: 'test',
      JWT_SECRET: 'test-only-secret-with-at-least-32-chars'
    });
    expect(error).toBeDefined();
  });

  it('rejects an invalid RSA private key', () => {
    const { error } = createConfigValidationSchema().validate({
      NODE_ENV: 'test',
      JWT_SECRET: 'test-only-secret-with-at-least-32-chars',
      AUTH_RSA_PRIVATE_KEY: 'not-a-private-key'
    });
    expect(error).toBeDefined();
  });

  it('rejects a missing JWT secret', () => {
    const { error } = createConfigValidationSchema().validate({
      NODE_ENV: 'development'
    });
    expect(error).toBeDefined();
  });

  it('rejects an invalid environment', () => {
    const { error } = createConfigValidationSchema().validate({
      NODE_ENV: 'invalid',
      JWT_SECRET: 'test-only-secret-with-at-least-32-chars',
      AUTH_RSA_PRIVATE_KEY: TEST_RSA_PRIVATE_KEY
    });
    expect(error).toBeDefined();
  });

  it('normalizes a valid test environment', () => {
    expect(
      validateEnvironment({
        NODE_ENV: 'test',
        DB_ENABLED: 'false',
        JWT_SECRET: 'test-only-secret-with-at-least-32-chars',
        AUTH_RSA_PRIVATE_KEY: TEST_RSA_PRIVATE_KEY
      })
    ).toMatchObject({ NODE_ENV: 'test', DB_ENABLED: false });
  });

  it('rejects disabled databases outside test', () => {
    expect(() =>
      validateEnvironment({
        NODE_ENV: 'development',
        DB_ENABLED: 'false',
        JWT_SECRET: 'test-only-secret-with-at-least-32-chars',
        AUTH_RSA_PRIVATE_KEY: TEST_RSA_PRIVATE_KEY
      })
    ).toThrow('开发和生产环境必须显式启用数据库');
  });

  it('rejects production defaults and incomplete database settings', () => {
    expect(() =>
      validateEnvironment({
        NODE_ENV: 'production',
        DB_ENABLED: 'true',
        JWT_SECRET: 'test-only-secret-with-at-least-32-chars',
        AUTH_RSA_PRIVATE_KEY: TEST_RSA_PRIVATE_KEY
      })
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
      DB_DATABASE: 'app',
      JWT_SECRET: 'test-only-secret-with-at-least-32-chars',
      AUTH_RSA_PRIVATE_KEY: TEST_RSA_PRIVATE_KEY
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
        database: 'app',
        synchronize: false
      },
      jwt: {
        secret: 'test-only-secret-with-at-least-32-chars',
        accessTokenExpiresIn: '15m',
        refreshTokenExpiresIn: '7d'
      },
      auth: { rsaPrivateKey: TEST_RSA_PRIVATE_KEY },
      swagger: { enabled: true, path: 'docs' },
      storage: {
        enabled: true,
        region: '',
        bucket: '',
        secretId: '',
        secretKey: ''
      },
      throttler: { ttl: 60000, limit: 100 }
    };
    expect(createApplicationConfigSchema().validate(config).error).toBeDefined();
  });
  it('微信登录关闭时允许省略凭据', () => {
    expect(
      validateEnvironment({
        NODE_ENV: 'test',
        DB_ENABLED: 'false',
        JWT_SECRET: 'test-only-secret-with-at-least-32-chars',
        AUTH_RSA_PRIVATE_KEY: TEST_RSA_PRIVATE_KEY,
        WECHAT_LOGIN_ENABLED: 'false'
      })
    ).toMatchObject({ WECHAT_LOGIN_ENABLED: false });
  });

  it('微信登录开启时必须同时提供 AppID 和 AppSecret', () => {
    expect(() =>
      validateEnvironment({
        NODE_ENV: 'test',
        DB_ENABLED: 'false',
        JWT_SECRET: 'test-only-secret-with-at-least-32-chars',
        AUTH_RSA_PRIVATE_KEY: TEST_RSA_PRIVATE_KEY,
        WECHAT_LOGIN_ENABLED: 'true',
        WECHAT_APP_ID: 'wx-app-id'
      })
    ).toThrow('启用微信登录时必须提供 WECHAT_APP_ID 和 WECHAT_APP_SECRET');
  });
});
