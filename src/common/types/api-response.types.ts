/** 统一成功响应。 */
export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T | null;
}

/** 统一错误响应。 */
export interface ApiErrorResponse {
  code: number;
  message: string;
  data: null;
}
