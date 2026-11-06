import { BadRequestException } from '@nestjs/common';
import type { RegistryValidationErrorDetail } from '../types/index.js';
/**
 * 构造代码注册表校验失败异常，错误数据只包含定位信息，不包含堆栈。
 *
 * @param detail - 注册表校验失败的定位信息。
 * @returns 携带定位信息的 BadRequestException。
 */
export function createRegistryValidationError(detail: RegistryValidationErrorDetail): BadRequestException {
  const { scope, target, field, actual, expected, resolution } = detail;
  return new BadRequestException({
    message: `${scope}注册校验失败: ${target}.${field}`,
    data: { target, field, actual, expected, resolution }
  });
}
