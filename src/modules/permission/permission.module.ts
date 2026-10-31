import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module.js';
import { PermissionController } from './permission.controller.js';
import { PermissionService } from './permission.service.js';

/** 权限目录模块。 */
@Module({
  imports: [AuditModule],
  controllers: [PermissionController],
  providers: [PermissionService],
  exports: [PermissionService],
})
export class PermissionModule {}
