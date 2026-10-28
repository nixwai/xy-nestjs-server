import { HttpMethod } from '../enums/http-method.enum.js';

/** 判断字符串是否为当前支持的 HTTP 方法。 */
export function isHttpMethod(value: string): value is HttpMethod {
  return Object.values(HttpMethod).includes(value as HttpMethod);
}
