import { randomUUID } from 'node:crypto';
import { hashPassword } from '#/common/utils/password-hash.util.js';
import type { AdminRepository } from '#/modules/admin/repositories/admin-repository.port.js';
import { PermissionCode } from '#/modules/authorization/constants/index.js';
import type { PermissionRepository } from '#/modules/permission/repositories/permission-repository.port.js';
import type { RoleRepository } from '#/modules/role/repositories/role-repository.port.js';

/** 生成只用于当前测试进程的合法密码。 */
export function createTestPassword(label: string): string {
  return `${label}-${randomUUID()}`;
}

/** 创建用于权限测试的管理员账号。 */
export async function seedAdmin(
  repository: AdminRepository,
  username: string,
  password: string,
  isRoot = false
): Promise<string> {
  const { hash, salt } = await hashPassword(password);
  const admin = await repository.create({ username, passwordHash: hash, passwordSalt: salt, isRoot });
  return admin.id;
}

/** 为管理员绑定指定权限，保持测试从权限目录和角色关系开始构造。 */
export async function grantPermissions(
  adminRepository: AdminRepository,
  roleRepository: RoleRepository,
  permissionRepository: PermissionRepository,
  adminId: string,
  codes: readonly string[],
  roleSuffix: string
): Promise<void> {
  const permissions = await Promise.all(codes.map(code => permissionRepository.findByCode(code)));
  const permissionIds = permissions.flatMap(permission => (permission ? [permission.id] : []));
  if (permissionIds.length !== codes.length) {
    throw new Error(`测试权限未注册：${codes.join(', ')}`);
  }
  const role = await roleRepository.create({
    code: `test-role-${adminId}-${roleSuffix}`,
    name: `测试角色-${adminId}-${roleSuffix}`
  });
  await roleRepository.bindPermissions(role.id, permissionIds);
  await adminRepository.bindRole(adminId, role.id);
}

/** 返回素材文件夹业务所需的完整权限集合。 */
export function allAssetPermissions(): readonly string[] {
  return [
    PermissionCode.ASSET_FOLDER_READ,
    PermissionCode.ASSET_FOLDER_ALL,
    PermissionCode.ASSET_FOLDER_CREATE,
    PermissionCode.ASSET_FOLDER_UPDATE,
    PermissionCode.ASSET_FOLDER_DELETE,
    PermissionCode.ASSET_IMAGE_READ,
    PermissionCode.ASSET_IMAGE_UPLOAD
  ];
}
