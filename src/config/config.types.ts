/** 应用运行环境。 */
export type AppEnvironment = 'development' | 'test' | 'production';

/** 应用配置。 */
export interface AppConfig {
  /** 当前运行环境。 */
  environment: AppEnvironment;

  /** HTTP 服务监听端口。 */
  port: number;

  /** API 全局路径前缀。 */
  globalPrefix: string;
}

/** CORS 配置。 */
export interface CorsConfig {
  /** 允许访问 API 的来源列表。 */
  origins: string[];
}

/** 数据库配置。 */
export interface DatabaseConfig {
  /** 是否启用数据库连接。 */
  enabled: boolean;

  /** 数据库主机地址。 */
  host: string;

  /** 数据库端口。 */
  port: number;

  /** 数据库登录用户名。 */
  username: string;

  /** 数据库登录密码。 */
  password: string;

  /** 数据库名称。 */
  database: string;

  /** 是否允许 ORM 自动同步结构，当前必须为 false。 */
  synchronize: boolean;
}

/** JWT 配置。 */
export interface JwtConfig {
  /** 用于签发和校验令牌的密钥。 */
  secret: string;

  /** 访问令牌有效期。 */
  accessTokenExpiresIn: string;

  /** 刷新令牌有效期。 */
  refreshTokenExpiresIn: string;
}

/** Swagger 配置。 */
export interface SwaggerConfig {
  /** 是否启用 Swagger 文档。 */
  enabled: boolean;

  /** Swagger 文档访问路径。 */
  path: string;
}

/** 对象存储配置。 */
export interface StorageConfig {
  /** 是否启用对象存储。 */
  enabled: boolean;

  /** COS 所在地域。 */
  region: string;

  /** COS 存储桶名称。 */
  bucket: string;

  /** COS 访问标识。 */
  secretId: string;

  /** COS 访问密钥。 */
  secretKey: string;
}

/** 微信配置。 */
export interface WechatConfig {
  /** 是否启用微信能力。 */
  enabled: boolean;

  /** 微信小程序 AppID。 */
  appId: string;

  /** 微信小程序 AppSecret。 */
  appSecret: string;
}

/** 限流配置。 */
export interface ThrottlerConfig {
  /** 限流窗口时长，单位为毫秒。 */
  ttl: number;

  /** 单个限流窗口允许的最大请求数。 */
  limit: number;
}

/** 应用总配置。 */
export interface ApplicationConfig {
  /** 应用运行配置。 */
  app: AppConfig;

  /** 跨域资源共享配置。 */
  cors: CorsConfig;

  /** 数据库连接配置。 */
  database: DatabaseConfig;

  /** JWT 令牌配置。 */
  jwt: JwtConfig;

  /** Swagger 文档配置。 */
  swagger: SwaggerConfig;

  /** 对象存储配置。 */
  storage: StorageConfig;

  /** 微信能力配置。 */
  wechat: WechatConfig;

  /** 请求限流配置。 */
  throttler: ThrottlerConfig;
}
