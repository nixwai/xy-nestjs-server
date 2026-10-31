import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module.js';
import { PermissionModule } from '../permission/permission.module.js';
import { RoleController } from './role.controller.js';
import { RoleService } from './role.service.js';

/** 角色模块。 */
@Module({
  imports: [PermissionModule, AuditModule],
  controllers: [RoleController],
  providers: [RoleService],
  exports: [RoleService],
})
export class RoleModule {}
