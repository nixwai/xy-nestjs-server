/** 应用运行环境。 */
export type AppEnvironment = 'development' | 'test' | 'production';

/** 应用配置。 */
export interface AppConfig {
  environment: AppEnvironment;
  port: number;
  globalPrefix: string;
}

/** CORS 配置。 */
export interface CorsConfig {
  origins: string[];
}

/** 数据库配置。 */
export interface DatabaseConfig {
  enabled: boolean;
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  synchronize: boolean;
}

/** JWT 配置。 */
export interface JwtConfig {
  secret: string;
  accessTokenExpiresIn: string;
  refreshTokenExpiresIn: string;
}

/** Swagger 配置。 */
export interface SwaggerConfig {
  enabled: boolean;
  path: string;
}

/** 对象存储配置。 */
export interface StorageConfig {
  enabled: boolean;
  region: string;
  bucket: string;
  secretId: string;
  secretKey: string;
}

/** 微信配置。 */
export interface WechatConfig {
  enabled: boolean;
  appId: string;
  appSecret: string;
}

/** 限流配置。 */
export interface ThrottlerConfig {
  ttl: number;
  limit: number;
}

/** API 版本配置。 */
export interface ApiConfig {
  versionHeader: string;
}

/** 应用总配置。 */
export interface ApplicationConfig {
  app: AppConfig;
  cors: CorsConfig;
  database: DatabaseConfig;
  jwt: JwtConfig;
  swagger: SwaggerConfig;
  storage: StorageConfig;
  wechat: WechatConfig;
  throttler: ThrottlerConfig;
  api: ApiConfig;
}
