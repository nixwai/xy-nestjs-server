import { describe, expect, it } from 'vitest';
import { validateEnvironment } from '#/config/config.validation.js';

const validEnvironment = {
  NODE_ENV: 'test',
  PORT: '3000',
  CORS_ORIGINS: 'http://localhost:9527',
  DB_ENABLED: 'false',
  DB_HOST: '',
  DB_PORT: '3306',
  DB_USERNAME: '',
  DB_PASSWORD: '',
  DB_DATABASE: '',
  JWT_SECRET: 'test-only-secret-with-at-least-32-chars',
  JWT_ACCESS_TOKEN_EXPIRES_IN: '15m',
  JWT_REFRESH_TOKEN_EXPIRES_IN: '7d',
  AUTH_RSA_PRIVATE_KEY: process.env.AUTH_RSA_PRIVATE_KEY,
  WECHAT_LOGIN_ENABLED: 'false',
  WECHAT_APP_ID: '',
  WECHAT_APP_SECRET: '',
  SWAGGER_ENABLED: 'false',
  IMAGE_QUALITY: '75',
  IMAGE_MAX_WIDTH: '3840',
  IMAGE_MAX_HEIGHT: '2160',
  IMAGE_MAX_FILE_SIZE: '52428800',
  IMAGE_MAX_FILES: '50',
  THROTTLE_TTL: '60000',
  THROTTLE_LIMIT: '100'
};

describe('环境变量校验', () => {
  it('将合法的测试环境变量转换为结构化值', () => {
    const result = validateEnvironment(validEnvironment);

    expect(result).toMatchObject({ NODE_ENV: 'test', PORT: 3000, DB_ENABLED: false, THROTTLE_LIMIT: 100 });
  });

  it('拒绝过短 JWT 密钥和非测试环境未启用数据库', () => {
    expect(() => validateEnvironment({ ...validEnvironment, JWT_SECRET: 'short' })).toThrow('环境配置校验失败');
    expect(() => validateEnvironment({ ...validEnvironment, NODE_ENV: 'development' })).toThrow(
      '开发和生产环境必须显式启用数据库'
    );
  });

  it('生产环境要求完整数据库配置并禁止占位密钥', () => {
    expect(() => validateEnvironment({ ...validEnvironment, NODE_ENV: 'production', DB_ENABLED: 'true' })).toThrow(
      '生产环境缺少数据库配置'
    );
    expect(() =>
      validateEnvironment({
        ...validEnvironment,
        NODE_ENV: 'production',
        DB_ENABLED: 'true',
        DB_HOST: 'localhost',
        DB_PORT: '3306',
        DB_USERNAME: 'root',
        DB_PASSWORD: 'password',
        DB_DATABASE: 'app'
      })
    ).toThrow('生产环境禁止使用占位或测试 JWT 密钥');
  });

  it('启用微信登录时要求完整的微信配置', () => {
    expect(() => validateEnvironment({ ...validEnvironment, WECHAT_LOGIN_ENABLED: 'true' })).toThrow(
      '启用微信登录时必须提供 WECHAT_APP_ID 和 WECHAT_APP_SECRET'
    );
  });
});
