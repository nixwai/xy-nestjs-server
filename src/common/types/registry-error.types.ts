/** 代码注册表校验失败时用于定位问题的信息。 */
export interface RegistryValidationErrorDetail {
  /** 注册表所属领域名称，用于拼接错误消息。 */
  scope: string;
  /** 出错的注册项标识。 */
  target: string;
  /** 出错的字段名称。 */
  field: string;
  /** 注册表或数据库中的实际值。 */
  actual: unknown;
  /** 校验期望的值。 */
  expected: unknown;
  /** 修复该矛盾的方式。 */
  resolution: string;
}
