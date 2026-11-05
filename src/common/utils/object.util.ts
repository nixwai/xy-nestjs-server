/**
 * 返回剔除值为 undefined 字段后的新对象，不修改传入对象。
 *
 * @param value - 待处理的对象。
 * @returns 只包含已定义字段的新对象。
 */
export function omitUndefined<T extends object>(value: T): T {
  return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined)) as T;
}
