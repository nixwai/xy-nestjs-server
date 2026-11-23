import { describe, expect, it } from 'vitest';
import { createApplicationConfigSchema } from '#/config/config.validation.js';

const baseApplicationConfig = {
  app: { environment: 'test', port: 3000, globalPrefix: 'api' },
  cors: { origins: ['http://localhost:9527'] },
  database: { enabled: false, host: '', port: 3306, username: '', password: '', database: '', synchronize: false },
  jwt: { secret: 'test-only-secret-with-at-least-32-chars', accessTokenExpiresIn: '15m', refreshTokenExpiresIn: '7d' },
  auth: { rsaPrivateKey: process.env.AUTH_RSA_PRIVATE_KEY ?? '' },
  wechat: { enabled: false, appId: '', appSecret: '' },
  swagger: { enabled: false, path: 'docs' },
  oss: { region: '', bucket: '', accessKeyId: '', accessKeySecret: '', publicBaseUrl: '' },
  image: { quality: 80, maxWidth: 1920, maxHeight: 1080, maxFileSize: 1000, maxFiles: 10 },
  throttler: { ttl: 60000, limit: 100 }
};

describe('最终应用配置 schema', () => {
  it('接受完整测试配置并拒绝非安全数据库同步', () => {
    const schema = createApplicationConfigSchema();
    expect(schema.validate(baseApplicationConfig).error).toBeUndefined();
    expect(
      schema.validate({ ...baseApplicationConfig, database: { ...baseApplicationConfig.database, synchronize: true } })
        .error
    ).toBeDefined();
  });

  it('启用数据库时要求完整连接信息', () => {
    const result = createApplicationConfigSchema().validate({
      ...baseApplicationConfig,
      database: { ...baseApplicationConfig.database, enabled: true }
    });
    expect(result.error?.message).toContain('启用数据库时必须提供完整连接配置');
  });

  it('启用微信登录时要求 AppID 和 AppSecret', () => {
    const result = createApplicationConfigSchema().validate({
      ...baseApplicationConfig,
      wechat: { enabled: true, appId: '', appSecret: '' }
    });
    expect(result.error?.message).toContain('启用微信登录时必须提供完整 AppID 和 AppSecret');
  });

  it('生产环境拒绝占位 JWT 密钥和非法图片/限流配置', () => {
    const production = {
      ...baseApplicationConfig,
      app: { ...baseApplicationConfig.app, environment: 'production' },
      database: {
        ...baseApplicationConfig.database,
        enabled: true,
        host: 'mysql',
        username: 'app',
        password: 'secret',
        database: 'app'
      }
    };
    expect(createApplicationConfigSchema().validate(production).error?.message).toContain(
      '生产环境禁止使用占位或测试 JWT 密钥'
    );
    expect(
      createApplicationConfigSchema().validate({
        ...baseApplicationConfig,
        image: { ...baseApplicationConfig.image, quality: 101 }
      }).error
    ).toBeDefined();
    expect(
      createApplicationConfigSchema().validate({ ...baseApplicationConfig, throttler: { ttl: 0, limit: 0 } }).error
    ).toBeDefined();
  });
});
