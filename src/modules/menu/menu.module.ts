import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module.js';
import { PermissionModule } from '../permission/permission.module.js';
import { MenuController } from './menu.controller.js';
import { MenuService } from './menu.service.js';

/** 菜单管理模块。 */
@Module({
  imports: [AuditModule, PermissionModule],
  controllers: [MenuController],
  providers: [MenuService],
  exports: [MenuService]
})
export class MenuModule {}
