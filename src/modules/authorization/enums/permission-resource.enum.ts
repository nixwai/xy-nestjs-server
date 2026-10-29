/** 当前系统已注册的权限资源。 */
export enum PermissionResource {
  /** 管理员账户资源。 */
  ADMIN = 'admin',
  /** 当前管理员授权资源。 */
  ADMIN_SELF = 'admin.self',
  /** 管理员角色绑定资源。 */
  ADMIN_ROLE = 'admin.role',
  /** 角色资源。 */
  ROLE = 'role',
  /** 权限目录资源。 */
  PERMISSION = 'permission',
  /** 角色权限绑定资源。 */
  ROLE_PERMISSION = 'role.permission',
  /** 管理审计资源。 */
  AUDIT = 'audit',
}
