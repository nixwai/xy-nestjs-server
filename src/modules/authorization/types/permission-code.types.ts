import type { PermissionCode as PermissionCodeConstant } from '../constants/permission-code.constant.js';

/** 系统动态权限编码，取值由权限编码常量声明。 */
export type PermissionCode = (typeof PermissionCodeConstant)[keyof typeof PermissionCodeConstant];
