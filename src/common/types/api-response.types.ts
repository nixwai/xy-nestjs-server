/** 统一成功响应。 */
export interface ApiResponse<T> {
  /** 业务响应码，成功时为 0。 */
  code: number;

  /** 面向客户端的响应消息。 */
  message: string;

  /** 业务响应数据，没有数据时为 null。 */
  data: T | null;
}

/** 统一错误响应。 */
export interface ApiErrorResponse {
  /** 业务错误码。 */
  code: number;

  /** 面向客户端的错误消息。 */
  message: string;

  /** 错误响应不携带业务数据。 */
  data: null;
}
