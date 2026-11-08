/** 由字段中文名称生成的请求参数校验消息集合。 */
export interface ValidationMessages {
  /** 非空校验消息。 */
  isNotEmpty: string;
  /** 字符串类型校验消息。 */
  isString: string;
  /** 布尔类型校验消息。 */
  isBoolean: string;
  /** 整数类型校验消息。 */
  isInt: string;
  /** 数字类型校验消息。 */
  isNumber: string;
  /** 数组类型校验消息。 */
  isArray: string;
  /** 邮箱格式校验消息。 */
  isEmail: string;
  /** 正则格式校验消息。 */
  matches: string;
  /** 生成最小值校验消息。 */
  min: (value: number) => string;
  /** 生成最大值校验消息。 */
  max: (value: number) => string;
  /** 生成最小长度校验消息。 */
  minLength: (value: number) => string;
  /** 生成最大长度校验消息。 */
  maxLength: (value: number) => string;
}
