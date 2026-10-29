import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditModule } from '../audit/audit.module.js';
import { shouldLoadDatabaseModule } from '../../config/configuration.js';
import { PermissionModule } from '../permission/permission.module.js';
import { RoleController } from './role.controller.js';
import { RoleService } from './role.service.js';
import { RolePermissionEntity } from './entities/role-permission.entity.js';
import { AdminRoleEntity } from '../admin/entities/admin-role.entity.js';
import { RoleEntity } from './entities/role.entity.js';
import { ROLE_REPOSITORY } from './repositories/role-repository.port.js';
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
            RolePermissionEntity,
            AdminRoleEntity,
          ]),
        ]
      : []),
  ],
  controllers: [RoleController],
  providers: [
    RoleService,
    {
      provide: ROLE_REPOSITORY,
      useClass: TypeOrmRoleRepository,
    },
  ],
  exports: [RoleService, ROLE_REPOSITORY],
})
export class RoleModule {}
