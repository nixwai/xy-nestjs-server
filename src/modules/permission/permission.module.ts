import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditModule } from '../audit/audit.module.js';
import { shouldLoadDatabaseModule } from '../../config/configuration.js';
import { PermissionEntity } from './entities/permission.entity.js';
import { PermissionController } from './permission.controller.js';
import { PermissionService } from './permission.service.js';
import { PERMISSION_REPOSITORY } from './repositories/permission-repository.port.js';
import { TypeOrmPermissionRepository } from './repositories/typeorm-permission.repository.js';

const databaseEnabled = shouldLoadDatabaseModule();

/** 权限目录模块。 */
@Module({
  imports: [
    AuditModule,
    ...(databaseEnabled ? [TypeOrmModule.forFeature([PermissionEntity])] : []),
  ],
  controllers: [PermissionController],
  providers: [
    PermissionService,
    {
      provide: PERMISSION_REPOSITORY,
      useClass: TypeOrmPermissionRepository,
    },
  ],
  exports: [PermissionService, PERMISSION_REPOSITORY],
})
export class PermissionModule {}
