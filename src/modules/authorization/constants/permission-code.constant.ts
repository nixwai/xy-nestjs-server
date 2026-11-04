export const PermissionCode = { AUDIT_READ: 'audit.read' } as const;

/** 系统动态权限编码。 */
export type PermissionCode = (typeof PermissionCode)[keyof typeof PermissionCode];
