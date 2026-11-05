import { BadRequestException } from '@nestjs/common';
import { PermissionCode } from '#/modules/authorization/constants/index.js';
import type {
  PermissionDefinitionPatch,
  PermissionRecord,
  RegisteredPermission
} from '#/modules/authorization/types/permission.types.js';
import type {
  RegisteredPermissionEntry,
  RegisteredPermissionGroup
} from '../constants/registered-permissions.constant.js';

/** 权限编码格式：小写分类、资源和动作分段，段内允许中划线。 */
const PERMISSION_CODE_PATTERN = /^[a-z][a-z0-9]*(?:\.[a-z][a-z0-9-]*)+$/;

/** 权限编码常量声明的全部编码。 */
const DECLARED_PERMISSION_CODES: readonly string[] = Object.values(PermissionCode);

/**
 * 校验权限注册表自身一致性以及与权限编码常量的双向对应关系。
 *
 * @param groups - 待校验的权限分组注册表。
 * @throws 分类或编码重复、编码与分类不匹配、分配边界冲突、与常量脱节时抛出 BadRequestException。
 */
export function validatePermissionRegistry(groups: readonly RegisteredPermissionGroup[]): void {
  const categories = new Set<string>();
  const codes = new Set<string>();
  for (const group of groups) {
    validateCategory(group, categories);
    for (const permission of group.permissions) {
      validatePermissionEntry(group.category, permission, codes);
    }
  }
  validateDeclaredPermissionCodes(codes);
}

/**
 * 比较数据库权限记录与注册表定义，得出需要对齐的代码维护字段。
 *
 * @param current - 数据库中的权限记录。
 * @param expected - 注册表中的权限定义。
 * @returns 存在差异时返回待写入字段，完全一致时返回 null。
 */
export function collectDefinitionChanges(
  current: PermissionRecord,
  expected: RegisteredPermission
): PermissionDefinitionPatch | null {
  const patch: PermissionDefinitionPatch = {
    ...(current.category === expected.category ? {} : { category: expected.category }),
    ...(current.name === expected.name ? {} : { name: expected.name }),
    ...(current.description === expected.description ? {} : { description: expected.description }),
    ...(current.isAssignable === expected.isAssignable ? {} : { isAssignable: expected.isAssignable }),
    ...(current.isProtected === expected.isProtected ? {} : { isProtected: expected.isProtected })
  };
  return Object.keys(patch).length === 0 ? null : patch;
}

/**
 * 校验分组分类唯一且具备可用的展示名称。
 *
 * @param group - 待校验的权限分组。
 * @param categories - 已出现的分类标识集合，校验通过后写入当前分类。
 */
function validateCategory(group: RegisteredPermissionGroup, categories: Set<string>): void {
  if (group.category === '') {
    throw registryError(group.name, 'category', group.category, '非空分类标识', '补齐分组分类标识');
  }
  if (categories.has(group.category)) {
    throw registryError(group.category, 'category', group.category, '唯一', '合并重复分组');
  }
  categories.add(group.category);
  if (group.name === '' || group.name === group.category) {
    throw registryError(group.category, 'name', group.name, '与分类标识不同的展示名称', '补齐分组展示名称');
  }
}

/**
 * 校验单个权限定义的编码格式、唯一性、分类归属和分配边界。
 *
 * @param category - 权限所在分组的分类标识。
 * @param permission - 分组内声明的权限定义。
 * @param codes - 已出现的权限编码集合，校验通过后写入当前编码。
 */
function validatePermissionEntry(category: string, permission: RegisteredPermissionEntry, codes: Set<string>): void {
  if (!PERMISSION_CODE_PATTERN.test(permission.code)) {
    throw registryError(permission.code, 'code', permission.code, '小写 <分类>.<资源>.<动作> 编码', '修正权限编码');
  }
  if (codes.has(permission.code)) {
    throw registryError(permission.code, 'code', permission.code, '唯一', '删除重复注册');
  }
  codes.add(permission.code);
  const codeCategory = permission.code.split('.')[0];
  if (codeCategory !== category) {
    throw registryError(permission.code, 'category', category, codeCategory, '将权限移入同首段分类');
  }
  if (permission.name === '') {
    throw registryError(permission.code, 'name', permission.name, '非空权限名称', '补齐权限名称');
  }
  if (permission.isProtected && permission.isAssignable) {
    throw registryError(permission.code, 'isAssignable', true, false, '受保护权限不得绑定给普通角色');
  }
}

/**
 * 校验权限编码常量与注册表双向一致。
 *
 * @param codes - 注册表中出现的全部权限编码。
 */
function validateDeclaredPermissionCodes(codes: Set<string>): void {
  for (const code of codes) {
    if (!DECLARED_PERMISSION_CODES.includes(code)) {
      throw registryError(code, 'code', code, 'PermissionCode 常量已声明', '在 PermissionCode 中声明该权限编码');
    }
  }
  for (const code of DECLARED_PERMISSION_CODES) {
    if (!codes.has(code)) {
      throw registryError(code, 'code', null, code, '在权限注册表中补齐该权限定义');
    }
  }
}

/**
 * 构造注册表校验失败异常。
 *
 * @param target - 出错的分类标识或权限编码。
 * @param field - 出错字段。
 * @param actual - 注册表中的实际值。
 * @param expected - 期望值。
 * @param resolution - 修复方式。
 * @returns 携带定位信息的 BadRequestException。
 */
function registryError(target: string, field: string, actual: unknown, expected: unknown, resolution: string) {
  return new BadRequestException({
    message: `权限注册校验失败: ${target}.${field}`,
    data: { target, field, actual, expected, resolution }
  });
}
