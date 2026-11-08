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

/** 管理员认证配置。 */
export interface AuthConfig {
  /** Base64 编码的 PKCS#8 RSA 私钥 DER。 */
  rsaPrivateKey: string;
}

/** 阿里 OSS 配置。 */
export interface OssConfig {
  /** OSS 区域。 */
  region: string;
  /** OSS Bucket 名称。 */
  bucket: string;
  /** AccessKey ID。 */
  accessKeyId: string;
  /** AccessKey Secret。 */
  accessKeySecret: string;
  /** 对外访问地址，可配置 OSS、CDN 或自定义域名。 */
  publicBaseUrl: string;
}

/** 图片处理配置。 */
export interface ImageConfig {
  /** 图片压缩质量。 */
  quality: number;
  /** 最大宽度。 */
  maxWidth: number;
  /** 最大高度。 */
  maxHeight: number;
  /** 单张图片最大字节数。 */
  maxFileSize: number;
  /** 批量上传最大文件数。 */
  maxFiles: number;
}

/** Swagger 配置。 */
export interface SwaggerConfig {
  /** 是否启用 Swagger 文档。 */
  enabled: boolean;
  /** Swagger 文档访问路径。 */
  path: string;
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
  /** 请求限流配置。 */
  throttler: ThrottlerConfig;
}

/** 环境文件加载选项。 */
export interface EnvironmentLoaderOptions {
  /** 环境文件所在目录。 */
  cwd?: string;
  /** 要加载的应用环境。 */
  environment?: AppEnvironment;
  /** 用于覆盖环境文件值的运行时环境变量。 */
  runtimeEnvironment?: NodeJS.ProcessEnv;
}
