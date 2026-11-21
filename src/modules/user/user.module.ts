import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module.js';
import { UserController, UserManagementController } from './user.controller.js';
import { UserService } from './user.service.js';

/** 提供微信用户资料和后台用户管理能力。 */
@Module({
  imports: [AuditModule],
  controllers: [UserController, UserManagementController],
  providers: [UserService],
  exports: [UserService]
})
export class UserModule {}
