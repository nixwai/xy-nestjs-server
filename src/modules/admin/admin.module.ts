import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module.js';
import { RoleModule } from '../role/role.module.js';
import { AdminController } from './admin.controller.js';
import { AdminService } from './admin.service.js';

/** 管理员账户模块。 */
@Module({
  imports: [RoleModule, AuditModule],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
