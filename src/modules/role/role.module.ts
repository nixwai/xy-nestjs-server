import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditModule } from '../audit/audit.module.js';
import { shouldLoadDatabaseModule } from '../../config/configuration.js';
import { PermissionModule } from '../permission/permission.module.js';
import { RoleController } from './role.controller.js';
import { RoleService } from './role.service.js';
import { RolePermissionAssignmentEntity } from './entities/role-permission-assignment.entity.js';
import { AdminRoleAssignmentEntity } from '../admin/entities/admin-role-assignment.entity.js';
import { RoleEntity } from './entities/role.entity.js';
import { ROLE_REPOSITORY } from './repositories/role-repository.port.js';
import { InMemoryRoleRepository } from './repositories/in-memory-role.repository.js';
import { TypeOrmRoleRepository } from './repositories/typeorm-role.repository.js';

const databaseEnabled = shouldLoadDatabaseModule();

/** 角色模块。 */
@Module({
  imports: [
    PermissionModule,
    AuditModule,
    ...(databaseEnabled
      ? [
          TypeOrmModule.forFeature([
            RoleEntity,
            RolePermissionAssignmentEntity,
            AdminRoleAssignmentEntity,
          ]),
        ]
      : []),
  ],
  controllers: [RoleController],
  providers: [
    RoleService,
    {
      provide: ROLE_REPOSITORY,
      useClass: databaseEnabled
        ? TypeOrmRoleRepository
        : InMemoryRoleRepository,
    },
  ],
  exports: [RoleService, ROLE_REPOSITORY],
})
export class RoleModule {}
