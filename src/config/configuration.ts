import {
  loadBaseConfig,
  mergeConfig,
  type ConfigRecord,
} from '../common/utils/config.util.js';
import { loadEnvironment } from './environment.js';
import {
  createApplicationConfigSchema,
  validateEnvironment,
} from './config.validation.js';
import type { ApplicationConfig } from './config.types.js';

/**
 * 构建并校验最终应用配置。
 *
 * @returns 经过环境变量覆盖和结构校验的应用配置。
 * @throws 当环境变量或最终配置不符合约束时抛出错误。
 */
export function buildApplicationConfig(): ApplicationConfig {
  loadEnvironment();
  const normalizedEnvironment = validateEnvironment(process.env);
  const config = applyEnvironmentOverrides(
    loadBaseConfig(),
    normalizedEnvironment as NodeJS.ProcessEnv,
  );
  const { error, value } = createApplicationConfigSchema().validate(config, {
    abortEarly: false,
    convert: true,
  });
  if (error) {
    throw new Error(`应用配置校验失败：${error.message}`);
  }
  return value as ApplicationConfig;
}

/**
 * 判断启动时是否需要加载数据库模块。
 *
 * @returns 当前配置是否启用数据库连接。
 */
export function shouldLoadDatabaseModule(): boolean {
  return buildApplicationConfig().database.enabled;
}

/**
 * 将环境变量显式映射到分组配置。
 *
 * @param baseConfig - YAML 文件提供的基础配置。
 * @param environment - 已解析的环境变量。
 * @returns 应用可消费的分组配置对象。
 */
export function applyEnvironmentOverrides(
  baseConfig: ConfigRecord,
  environment: NodeJS.ProcessEnv,
): ConfigRecord {
  const nodeEnvironment = readString(
    environment.NODE_ENV,
    baseConfigValue(baseConfig, ['app', 'environment'], 'development'),
  );
  const databaseEnabled =
    nodeEnvironment === 'test'
      ? false
      : readBoolean(
          environment.DB_ENABLED,
          baseConfigValue(baseConfig, ['database', 'enabled'], true),
        );

  return mergeConfig(baseConfig, {
    app: {
      environment: nodeEnvironment,
      port: readNumber(
        environment.PORT ?? environment.APP_PORT,
        baseConfigValue(baseConfig, ['app', 'port'], 3000),
      ),
    },
    cors: {
      origins: readOrigins(
        environment.CORS_ORIGINS,
        baseConfigValue(baseConfig, ['cors', 'origins'], []),
      ),
    },
    database: {
      enabled: databaseEnabled,
      host: readString(
        environment.DB_HOST,
        baseConfigValue(baseConfig, ['database', 'host'], 'localhost'),
      ),
      port: readNumber(
        environment.DB_PORT,
        baseConfigValue(baseConfig, ['database', 'port'], 3306),
      ),
      username: readString(
        environment.DB_USERNAME,
        baseConfigValue(baseConfig, ['database', 'username'], 'root'),
      ),
      password: readString(
        environment.DB_PASSWORD,
        baseConfigValue(baseConfig, ['database', 'password'], ''),
      ),
      database: readString(
        environment.DB_DATABASE,
        baseConfigValue(baseConfig, ['database', 'database'], 'scenic_booking'),
      ),
      synchronize: false,
    },
    jwt: {
      secret: readString(
        environment.JWT_SECRET,
        baseConfigValue(baseConfig, ['jwt', 'secret'], ''),
      ),
      accessTokenExpiresIn: readString(
        environment.JWT_ACCESS_TOKEN_EXPIRES_IN,
        baseConfigValue(baseConfig, ['jwt', 'accessTokenExpiresIn'], '15m'),
      ),
      refreshTokenExpiresIn: readString(
        environment.JWT_REFRESH_TOKEN_EXPIRES_IN,
        baseConfigValue(baseConfig, ['jwt', 'refreshTokenExpiresIn'], '7d'),
      ),
    },
    swagger: {
      enabled: readBoolean(
        environment.SWAGGER_ENABLED,
        baseConfigValue(baseConfig, ['swagger', 'enabled'], true),
      ),
    },
    storage: {
      enabled: readBoolean(
        environment.STORAGE_ENABLED,
        baseConfigValue(baseConfig, ['storage', 'enabled'], false),
      ),
      region: readString(
        environment.COS_REGION,
        baseConfigValue(baseConfig, ['storage', 'region'], ''),
      ),
      bucket: readString(
        environment.COS_BUCKET,
        baseConfigValue(baseConfig, ['storage', 'bucket'], ''),
      ),
      secretId: readString(
        environment.COS_SECRET_ID,
        baseConfigValue(baseConfig, ['storage', 'secretId'], ''),
      ),
      secretKey: readString(
        environment.COS_SECRET_KEY,
        baseConfigValue(baseConfig, ['storage', 'secretKey'], ''),
      ),
    },
    wechat: {
      enabled: readBoolean(
        environment.WECHAT_ENABLED,
        baseConfigValue(baseConfig, ['wechat', 'enabled'], false),
      ),
      appId: readString(
        environment.WECHAT_APP_ID,
        baseConfigValue(baseConfig, ['wechat', 'appId'], ''),
      ),
      appSecret: readString(
        environment.WECHAT_APP_SECRET,
        baseConfigValue(baseConfig, ['wechat', 'appSecret'], ''),
      ),
    },
    throttler: {
      ttl: readNumber(
        environment.THROTTLE_TTL,
        baseConfigValue(baseConfig, ['throttler', 'ttl'], 60000),
      ),
      limit: readNumber(
        environment.THROTTLE_LIMIT,
        baseConfigValue(baseConfig, ['throttler', 'limit'], 100),
      ),
    },
  });
}

/** 从嵌套配置中读取值，不存在时返回默认值。 */
function baseConfigValue(
  config: ConfigRecord,
  path: string[],
  fallback: unknown,
): unknown {
  let current: unknown = config;
  for (const segment of path) {
    if (!isRecord(current) || !(segment in current)) {
      return fallback;
    }
    current = current[segment];
  }
  return current ?? fallback;
}

/** 读取字符串环境变量，不存在时转换默认值。 */
function readString(value: string | undefined, fallback: unknown): string {
  return value ?? String(fallback);
}

/** 读取数值环境变量，并将默认值转换为数字。 */
function readNumber(
  value: string | undefined,
  fallback: unknown,
): number | string {
  return value === undefined ? Number(fallback) : Number(value);
}

/** 读取布尔环境变量，保留无法识别的值供后续校验。 */
function readBoolean(
  value: string | undefined,
  fallback: unknown,
): boolean | string {
  if (value === undefined) {
    return Boolean(fallback);
  }
  if (value === 'true') {
    return true;
  }
  if (value === 'false') {
    return false;
  }
  return value;
}

/** 将逗号分隔的来源列表转换为数组。 */
function readOrigins(
  value: string | undefined,
  fallback: unknown,
): string[] | string {
  if (value === undefined) {
    return Array.isArray(fallback) ? ([...fallback] as string[]) : [];
  }
  return value
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

/** 判断值是否为非数组对象。 */
function isRecord(value: unknown): value is ConfigRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** 默认的应用配置构建函数。 */
export default buildApplicationConfig;
