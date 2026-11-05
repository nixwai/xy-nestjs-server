import { createRegistryValidationError } from '#/common/utils/index.js';
import type { MenuRecord, MenuStructureField } from '../types/menu.types.js';

/** 菜单注册表在错误消息中的作用域名称。 */
const REGISTRY_SCOPE = '菜单';

/**
 * 构造菜单注册表校验失败异常。
 *
 * @param menuKey - 出错的菜单稳定标识。
 * @param field - 出错字段。
 * @param actual - 实际值。
 * @param expected - 期望值。
 * @param resolution - 修复方式。
 * @returns 携带定位信息的 BadRequestException。
 */
export function menuRegistryError(
  menuKey: string,
  field: string,
  actual: unknown,
  expected: unknown,
  resolution: string
) {
  return createRegistryValidationError({ scope: REGISTRY_SCOPE, target: menuKey, field, actual, expected, resolution });
}

/**
 * 校验已持久化菜单的结构字段与注册表定义一致。
 *
 * @param item - 数据库中的菜单记录。
 * @param field - 待校验的结构字段。
 * @param expected - 注册表中的期望值。
 * @throws 字段值与注册表不一致时抛出 BadRequestException。
 */
export function validateMenuStructureMatch(item: MenuRecord, field: MenuStructureField, expected: unknown): void {
  if (item[field] !== expected) {
    throw menuRegistryError(item.menuKey, field, item[field], expected, '通过 Migration 修正结构字段');
  }
}
