import type { ValidationMessages } from '../types/index.js';

/**
 * 根据字段中文名称生成统一的请求参数校验消息。
 *
 * @param label - 字段中文名称。
 * @returns 该字段全部校验场景使用的消息集合。
 */
export function createValidationMessages(label: string): ValidationMessages {
  return {
    isNotEmpty: `${label}不能为空`,
    isString: `${label}必须是字符串`,
    isBoolean: `${label}必须是布尔值`,
    isInt: `${label}必须是整数`,
    isNumber: `${label}必须是数字`,
    isArray: `${label}必须是数组`,
    isEmail: `${label}邮箱格式不正确`,
    matches: `${label}格式不正确`,
    min: (value: number) => `${label}不能小于${value}`,
    max: (value: number) => `${label}不能大于${value}`,
    minLength: (value: number) => `${label}长度不能少于${value}个字符`,
    maxLength: (value: number) => `${label}长度不能超过${value}个字符`
  };
}
