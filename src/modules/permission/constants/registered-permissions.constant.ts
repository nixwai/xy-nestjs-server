import { HttpMethod, PermissionResource } from '../../authorization/enums/index.js';
import { createPermissionCode } from '../../authorization/utils/permission-code.util.js';
import type { RegisteredPermission } from '../../authorization/types/permission.types.js';

/** 由代码维护的默认权限目录。 */
export const REGISTERED_PERMISSIONS: RegisteredPermission[] = [
  {
    code: createPermissionCode(PermissionResource.ADMIN_SELF, HttpMethod.GET),
    resource: PermissionResource.ADMIN_SELF,
    method: HttpMethod.GET,
    name: '查看个人授权',
    description: '查看当前管理员信息和权限',
    isActive: true
  },
  {
    code: createPermissionCode(PermissionResource.ADMIN, HttpMethod.GET),
    resource: PermissionResource.ADMIN,
    method: HttpMethod.GET,
    name: '查看管理员',
    description: '查看管理员列表',
    isActive: true
  },
  {
    code: createPermissionCode(PermissionResource.ADMIN, HttpMethod.POST),
    resource: PermissionResource.ADMIN,
    method: HttpMethod.POST,
    name: '管理管理员',
    description: '创建、修改和删除管理员',
    isActive: true
  },
  {
    code: createPermissionCode(PermissionResource.ADMIN_ROLE, HttpMethod.POST),
    resource: PermissionResource.ADMIN_ROLE,
    method: HttpMethod.POST,
    name: '绑定管理员角色',
    description: '绑定或解绑管理员角色',
    isActive: true
  },
  {
    code: createPermissionCode(PermissionResource.ROLE, HttpMethod.GET),
    resource: PermissionResource.ROLE,
    method: HttpMethod.GET,
    name: '查看角色',
    description: '查看角色列表',
    isActive: true
  },
  {
    code: createPermissionCode(PermissionResource.ROLE, HttpMethod.POST),
    resource: PermissionResource.ROLE,
    method: HttpMethod.POST,
    name: '管理角色',
    description: '创建、修改和删除角色',
    isActive: true
  },
  {
    code: createPermissionCode(PermissionResource.PERMISSION, HttpMethod.GET),
    resource: PermissionResource.PERMISSION,
    method: HttpMethod.GET,
    name: '查看权限',
    description: '查看权限目录',
    isActive: true
  },
  {
    code: createPermissionCode(PermissionResource.PERMISSION, HttpMethod.POST),
    resource: PermissionResource.PERMISSION,
    method: HttpMethod.POST,
    name: '管理权限状态',
    description: '启用或停用权限',
    isActive: true
  },
  {
    code: createPermissionCode(PermissionResource.ROLE_PERMISSION, HttpMethod.POST),
    resource: PermissionResource.ROLE_PERMISSION,
    method: HttpMethod.POST,
    name: '绑定角色权限',
    description: '绑定或解绑角色权限',
    isActive: true
  },
  {
    code: createPermissionCode(PermissionResource.MENU, HttpMethod.GET),
    resource: PermissionResource.MENU,
    method: HttpMethod.GET,
    name: '查看菜单',
    description: '查看后台菜单',
    isActive: true
  },
  {
    code: createPermissionCode(PermissionResource.MENU, HttpMethod.POST),
    resource: PermissionResource.MENU,
    method: HttpMethod.POST,
    name: '管理菜单',
    description: '创建、修改和删除后台菜单',
    isActive: true
  },
  {
    code: createPermissionCode(PermissionResource.AUDIT, HttpMethod.GET),
    resource: PermissionResource.AUDIT,
    method: HttpMethod.GET,
    name: '查看审计',
    description: '查看管理员变更审计',
    isActive: true
  }
];
