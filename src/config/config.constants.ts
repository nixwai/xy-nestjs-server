/** ConfigService 使用的配置键。 */
export const CONFIG_KEYS = {
  /** 应用运行配置键。 */
  app: 'app',

  /** CORS 配置键。 */
  cors: 'cors',

  /** 数据库配置键。 */
  database: 'database',

  /** JWT 配置键。 */
  jwt: 'jwt',

  /** 管理员认证配置键。 */
  auth: 'auth',

  /** Swagger 配置键。 */
  swagger: 'swagger',

  /** 限流配置键。 */
  throttler: 'throttler'
} as const;
