/** 审计动作编码到中文展示名称的注册表。 */
export const AUDIT_ACTION_LABELS: Readonly<Record<string, string>> = Object.freeze({
  'admin.create': '创建管理员',
  'admin.update': '更新管理员',
  'admin.reset-password': '重置管理员密码',
  'admin.soft-delete': '删除管理员',
  'admin.role-bind': '绑定管理员角色',
  'admin.role-unbind': '解绑管理员角色',
  'role.create': '创建角色',
  'role.update': '更新角色',
  'role.soft-delete': '删除角色',
  'role.permission-bind': '绑定角色权限',
  'role.permission-unbind': '解绑角色权限',
  'permission.enable': '启用权限',
  'permission.disable': '停用权限',
  'menu.create': '创建菜单',
  'menu.update': '更新菜单',
  'menu.soft-delete': '删除菜单'
});
/** 审计资源类型编码到中文展示名称的注册表。 */
export const AUDIT_RESOURCE_LABELS: Readonly<Record<string, string>> = Object.freeze({
  admin: '管理员',
  role: '角色',
  permission: '权限',
  menu: '菜单'
});
export function getAuditActionLabel(action: string): string {
  return AUDIT_ACTION_LABELS[action] ?? action;
}
export function getAuditResourceLabel(resourceType: string): string {
  return AUDIT_RESOURCE_LABELS[resourceType] ?? resourceType;
}
