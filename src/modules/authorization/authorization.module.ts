import { Module } from '@nestjs/common';
import { AdminModule } from '../admin/admin.module.js';
import { PermissionModule } from '../permission/permission.module.js';
import { RoleModule } from '../role/role.module.js';
import { AuthorizationService } from './authorization.service.js';
import { RbacGuard } from './guards/rbac.guard.js';

/** 运行时授权模块。 */
@Module({
  imports: [AdminModule, RoleModule, PermissionModule],
  providers: [AuthorizationService, RbacGuard],
  exports: [AuthorizationService, RbacGuard],
})
export class AuthorizationModule {}
