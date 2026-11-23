import { describe, expect, it } from 'vitest';
import {
  createApplicationConfigSchema,
  createConfigValidationSchema,
  validateEnvironment
} from '#/config/config.validation.js';

const rsaKey = process.env.AUTH_RSA_PRIVATE_KEY ?? '';
const base = {
  NODE_ENV: 'test',
  DB_ENABLED: 'false',
  JWT_SECRET: 'test-only-secret-with-at-least-32-chars',
  AUTH_RSA_PRIVATE_KEY: rsaKey
};

describe('环境校验边界', () => {
  it('拒绝缺失和非法 RSA 私钥、JWT 密钥及运行环境', () => {
    expect(
      createConfigValidationSchema().validate({ NODE_ENV: 'test', JWT_SECRET: base.JWT_SECRET }).error
    ).toBeDefined();
    expect(createConfigValidationSchema().validate({ ...base, AUTH_RSA_PRIVATE_KEY: 'invalid' }).error).toBeDefined();
    expect(createConfigValidationSchema().validate({ ...base, NODE_ENV: 'invalid' }).error).toBeDefined();
    expect(createConfigValidationSchema().validate({ ...base, JWT_SECRET: 'short' }).error).toBeDefined();
  });

  it('合法测试环境转换布尔值，开发和生产环境要求数据库', () => {
    expect(validateEnvironment({ ...base })).toMatchObject({ NODE_ENV: 'test', DB_ENABLED: false });
    expect(() => validateEnvironment({ ...base, NODE_ENV: 'development' })).toThrow('开发和生产环境必须显式启用数据库');
    expect(() => validateEnvironment({ ...base, NODE_ENV: 'production', DB_ENABLED: 'true' })).toThrow(
      '生产环境缺少数据库配置'
    );
  });

  it('生产环境完整配置禁止弱密钥，应用配置 schema 拒绝未知结构', () => {
    expect(() =>
      validateEnvironment({
        ...base,
        NODE_ENV: 'production',
        DB_ENABLED: 'true',
        DB_HOST: 'mysql.internal',
        DB_PORT: 3306,
        DB_USERNAME: 'app',
        DB_PASSWORD: 'strong-password',
        DB_DATABASE: 'app'
      })
    ).toThrow('生产环境禁止使用占位或测试 JWT 密钥');
    expect(
      createApplicationConfigSchema().validate({
        app: { environment: 'test', port: 3000, globalPrefix: 'api' },
        unexpected: true
      }).error
    ).toBeDefined();
  });
});
