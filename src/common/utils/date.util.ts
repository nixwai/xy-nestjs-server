/**
 * 返回偏移指定秒数后的新时间，不修改传入时间。
 *
 * @param date - 基准时间。
 * @param seconds - 需要增加的秒数，可为负数。
 * @returns 偏移后的新时间对象。
 */
export function addSeconds(date: Date, seconds: number): Date {
  return new Date(date.getTime() + seconds * 1000);
}
