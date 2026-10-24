/** 应用业务错误码。 */
export enum HttpCode {
  /** 请求处理成功。 */
  SUCCESS = 0,

  /** 请求参数无效。 */
  BAD_REQUEST = 40001,

  /** 请求未通过身份认证。 */
  UNAUTHORIZED = 40100,

  /** 当前身份无权执行请求。 */
  FORBIDDEN = 40300,

  /** 请求的资源不存在。 */
  NOT_FOUND = 40400,

  /** 请求与当前资源状态冲突。 */
  CONFLICT = 40900,

  /** 请求参数无法通过业务校验。 */
  UNPROCESSABLE_ENTITY = 42200,

  /** 请求超过访问频率限制。 */
  TOO_MANY_REQUESTS = 42900,

  /** 服务端发生未预期错误。 */
  INTERNAL_SERVER_ERROR = 50000,

  /** 请求缺少受支持的 API 版本信息。 */
  UNSUPPORTED_VERSION = 40002,
}
