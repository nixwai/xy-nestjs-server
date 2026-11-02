import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module.js';
import { RoleModule } from '../role/role.module.js';
import { PermissionModule } from '../permission/permission.module.js';
import { AdminAuthorizationQueryService } from './authorization-query.service.js';
import { MenuModule } from '../menu/menu.module.js';
import { AdminController } from './admin.controller.js';
import { AdminService } from './admin.service.js';
import { SecurityModule } from '../../common/security/index.js';

/** 管理员账户模块。 */
@Module({
  imports: [RoleModule, PermissionModule, MenuModule, AuditModule, SecurityModule],
  controllers: [AdminController],
  providers: [AdminService, AdminAuthorizationQueryService],
  exports: [AdminService, AdminAuthorizationQueryService]
})
export class AdminModule {}
