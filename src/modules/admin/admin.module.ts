import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditModule } from '../audit/audit.module.js';
import { RoleModule } from '../role/role.module.js';
import { shouldLoadDatabaseModule } from '../../config/configuration.js';
import { AdminController } from './admin.controller.js';
import { AdminService } from './admin.service.js';
import { AdminRoleAssignmentEntity } from './entities/admin-role-assignment.entity.js';
import { AdminEntity } from './entities/admin.entity.js';
import { AdminSessionEntity } from './entities/admin-session.entity.js';
import {
  ADMIN_REPOSITORY,
  ADMIN_TRANSACTION_RUNNER,
} from './repositories/admin-repository.port.js';
import { InMemoryAdminRepository } from './repositories/in-memory-admin.repository.js';
import { TypeOrmAdminRepository } from './repositories/typeorm-admin.repository.js';
import { InMemoryAdminTransactionRunner } from './repositories/in-memory-admin-transaction-runner.js';
import { TypeOrmAdminTransactionRunner } from './repositories/typeorm-admin-transaction-runner.js';

const databaseEnabled = shouldLoadDatabaseModule();

/** 管理员账户模块。 */
@Module({
  imports: [
    RoleModule,
    AuditModule,
    ...(databaseEnabled
      ? [
          TypeOrmModule.forFeature([
            AdminEntity,
            AdminRoleAssignmentEntity,
            AdminSessionEntity,
          ]),
        ]
      : []),
  ],
  controllers: [AdminController],
  providers: [
    AdminService,
    {
      provide: ADMIN_REPOSITORY,
      useClass: databaseEnabled
        ? TypeOrmAdminRepository
        : InMemoryAdminRepository,
    },
    {
      provide: ADMIN_TRANSACTION_RUNNER,
      useClass: databaseEnabled
        ? TypeOrmAdminTransactionRunner
        : InMemoryAdminTransactionRunner,
    },
  ],
  exports: [AdminService, ADMIN_REPOSITORY, ADMIN_TRANSACTION_RUNNER],
})
export class AdminModule {}
