import Joi from 'joi';

/**
 * 创建原始环境变量校验器。
 *
 * @returns 用于校验进程环境变量的 Joi schema。
 */
export function createConfigValidationSchema(): Joi.ObjectSchema {
  return Joi.object({
    NODE_ENV: Joi.string().valid('development', 'test', 'production').default('development'),
    PORT: Joi.number().port(),
    APP_PORT: Joi.number().port(),
    CORS_ORIGINS: Joi.string().allow(''),
    DB_ENABLED: Joi.boolean().truthy('true').falsy('false'),
    DB_HOST: Joi.string().allow(''),
    DB_PORT: Joi.number().port(),
    DB_USERNAME: Joi.string().allow(''),
    DB_PASSWORD: Joi.string().allow(''),
    DB_DATABASE: Joi.string().allow(''),
    JWT_SECRET: Joi.string().min(32).required(),
    JWT_ACCESS_TOKEN_EXPIRES_IN: Joi.string().min(1),
    JWT_REFRESH_TOKEN_EXPIRES_IN: Joi.string().min(1),
    SWAGGER_ENABLED: Joi.boolean().truthy('true').falsy('false'),
    STORAGE_ENABLED: Joi.boolean().truthy('true').falsy('false'),
    COS_REGION: Joi.string().allow(''),
    COS_BUCKET: Joi.string().allow(''),
    COS_SECRET_ID: Joi.string().allow(''),
    COS_SECRET_KEY: Joi.string().allow(''),
    WECHAT_ENABLED: Joi.boolean().truthy('true').falsy('false'),
    WECHAT_APP_ID: Joi.string().allow(''),
    WECHAT_APP_SECRET: Joi.string().allow(''),
    THROTTLE_TTL: Joi.number().integer().positive(),
    THROTTLE_LIMIT: Joi.number().integer().positive()
  })
    .custom((value, helpers) => {
      if (value.NODE_ENV !== 'test' && value.DB_ENABLED !== true) {
        return helpers.message({ custom: '开发和生产环境必须显式启用数据库' });
      }
      if (value.NODE_ENV === 'production') {
        const requiredKeys = ['DB_HOST', 'DB_PORT', 'DB_USERNAME', 'DB_PASSWORD', 'DB_DATABASE'] as const;
        const missingKeys = requiredKeys.filter(key => !value[key]);
        if (missingKeys.length > 0) {
          return helpers.message({
            custom: `生产环境缺少数据库配置：${missingKeys.join(', ')}`
          });
        }
        if (isWeakProductionSecret(value.JWT_SECRET)) {
          return helpers.message({
            custom: '生产环境禁止使用占位或测试 JWT 密钥'
          });
        }
      }
      if (value.STORAGE_ENABLED === true) {
        const requiredKeys = ['COS_REGION', 'COS_BUCKET', 'COS_SECRET_ID', 'COS_SECRET_KEY'] as const;
        const missingKeys = requiredKeys.filter(key => !value[key]);
        if (missingKeys.length > 0) {
          return helpers.message({
            custom: `启用对象存储时缺少配置：${missingKeys.join(', ')}`
          });
        }
      }
      if (value.WECHAT_ENABLED === true) {
        const requiredKeys = ['WECHAT_APP_ID', 'WECHAT_APP_SECRET'] as const;
        const missingKeys = requiredKeys.filter(key => !value[key]);
        if (missingKeys.length > 0) {
          return helpers.message({
            custom: `启用微信能力时缺少配置：${missingKeys.join(', ')}`
          });
        }
      }
      return value;
    })
    .unknown(true);
}

/**
 * 创建最终应用配置校验器。
 *
 * @returns 用于校验分组应用配置的 Joi schema。
 */
export function createApplicationConfigSchema(): Joi.ObjectSchema {
  return Joi.object({
    app: Joi.object({
      environment: Joi.string().valid('development', 'test', 'production').required(),
      port: Joi.number().port().required(),
      globalPrefix: Joi.string().min(1).required()
    }).required(),
    cors: Joi.object({
      origins: Joi.array().items(Joi.string().uri()).required()
    }).required(),
    database: Joi.object({
      enabled: Joi.boolean().required(),
      host: Joi.string().allow('').required(),
      port: Joi.number().port().required(),
      username: Joi.string().allow('').required(),
      password: Joi.string().allow('').required(),
      database: Joi.string().allow('').required(),
      synchronize: Joi.boolean().valid(false).required()
    })
      .custom((value, helpers) => {
        if (value.enabled && (!value.host || !value.username || !value.password || !value.database)) {
          return helpers.message({
            custom: '启用数据库时必须提供完整连接配置'
          });
        }
        return value;
      })
      .required(),
    jwt: Joi.object({
      secret: Joi.string().min(32).required(),
      accessTokenExpiresIn: Joi.string().min(1).required(),
      refreshTokenExpiresIn: Joi.string().min(1).required()
    }).required(),
    swagger: Joi.object({
      enabled: Joi.boolean().required(),
      path: Joi.string().min(1).required()
    }).required(),
    storage: Joi.object({
      enabled: Joi.boolean().required(),
      region: Joi.string().allow('').required(),
      bucket: Joi.string().allow('').required(),
      secretId: Joi.string().allow('').required(),
      secretKey: Joi.string().allow('').required()
    })
      .custom((value, helpers) => {
        if (value.enabled && (!value.region || !value.bucket || !value.secretId || !value.secretKey)) {
          return helpers.message({
            custom: '启用对象存储时必须提供完整 COS 配置'
          });
        }
        return value;
      })
      .required(),
    wechat: Joi.object({
      enabled: Joi.boolean().required(),
      appId: Joi.string().allow('').required(),
      appSecret: Joi.string().allow('').required()
    })
      .custom((value, helpers) => {
        if (value.enabled && (!value.appId || !value.appSecret)) {
          return helpers.message({
            custom: '启用微信能力时必须提供完整微信配置'
          });
        }
        return value;
      })
      .required(),
    throttler: Joi.object({
      ttl: Joi.number().integer().positive().required(),
      limit: Joi.number().integer().positive().required()
    }).required()
  })
    .custom((value, helpers) => {
      if (value.app.environment === 'production' && isWeakProductionSecret(value.jwt.secret)) {
        return helpers.message({
          custom: '生产环境禁止使用占位或测试 JWT 密钥'
        });
      }
      return value;
    })
    .unknown(false);
}

/**
 * 校验并归一化进程环境变量。
 *
 * @param environment - 待校验的环境变量记录。
 * @returns 通过校验并完成类型转换的环境变量记录。
 * @throws 当环境变量不符合约束时抛出错误。
 */
export function validateEnvironment(environment: Record<string, unknown>): Record<string, unknown> {
  const { error, value } = createConfigValidationSchema().validate(environment, {
    abortEarly: false,
    allowUnknown: true,
    convert: true
  });
  if (error) {
    throw new Error(`环境配置校验失败：${error.message}`);
  }
  return value as Record<string, unknown>;
}

/** 判断值是否为常见的占位或测试密钥。 */
function isWeakProductionSecret(value: unknown): boolean {
  if (typeof value !== 'string') {
    return true;
  }
  return /replace-with|change-me|test-only|example|default-secret/i.test(value);
}
