import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { shouldLoadDatabaseModule } from '../config/configuration.js';
import { DatabaseModule } from './database/database.module.js';
import { AdminRoleAssignmentEntity } from '../modules/admin/entities/admin-role-assignment.entity.js';
import { AdminSessionEntity } from '../modules/admin/entities/admin-session.entity.js';
import { AdminEntity } from '../modules/admin/entities/admin.entity.js';
import { AuditLogEntity } from '../modules/audit/entities/audit-log.entity.js';
import { PermissionEntity } from '../modules/permission/entities/permission.entity.js';
import { RolePermissionAssignmentEntity } from '../modules/role/entities/role-permission-assignment.entity.js';
import { RoleEntity } from '../modules/role/entities/role.entity.js';
import { ADMIN_REPOSITORY, ADMIN_TRANSACTION_RUNNER } from '../modules/admin/repositories/admin-repository.port.js';
import { InMemoryAdminRepository } from '../modules/admin/repositories/in-memory-admin.repository.js';
import { TypeOrmAdminRepository } from '../modules/admin/repositories/typeorm-admin.repository.js';
import { InMemoryAdminTransactionRunner } from '../modules/admin/repositories/in-memory-admin-transaction-runner.js';
import { TypeOrmAdminTransactionRunner } from '../modules/admin/repositories/typeorm-admin-transaction-runner.js';
import { AUTH_SESSION_REPOSITORY } from '../modules/auth/repositories/auth-session-repository.port.js';
import { InMemoryAuthSessionRepository } from '../modules/auth/repositories/in-memory-auth-session.repository.js';
import { TypeOrmAuthSessionRepository } from '../modules/auth/repositories/typeorm-auth-session.repository.js';
import { ROLE_REPOSITORY } from '../modules/role/repositories/role-repository.port.js';
import { InMemoryRoleRepository } from '../modules/role/repositories/in-memory-role.repository.js';
import { TypeOrmRoleRepository } from '../modules/role/repositories/typeorm-role.repository.js';
import { PERMISSION_REPOSITORY } from '../modules/permission/repositories/permission-repository.port.js';
import { InMemoryPermissionRepository } from '../modules/permission/repositories/in-memory-permission.repository.js';
import { TypeOrmPermissionRepository } from '../modules/permission/repositories/typeorm-permission.repository.js';
import { MenuEntity } from '../modules/menu/entities/menu.entity.js';
import { MENU_REPOSITORY } from '../modules/menu/repositories/menu-repository.port.js';
import { InMemoryMenuRepository } from '../modules/menu/repositories/in-memory-menu.repository.js';
import { TypeOrmMenuRepository } from '../modules/menu/repositories/typeorm-menu.repository.js';
import { AssetFolderEntity } from '../modules/asset/entities/asset-folder.entity.js';
import { AssetImageEntity } from '../modules/asset/entities/asset-image.entity.js';
import {
  ASSET_FOLDER_REPOSITORY,
  ASSET_IMAGE_REPOSITORY
} from '../modules/asset/repositories/asset-repository.port.js';
import {
  InMemoryAssetFolderRepository,
  InMemoryAssetImageRepository
} from '../modules/asset/repositories/in-memory-asset.repository.js';
import {
  TypeOrmAssetFolderRepository,
  TypeOrmAssetImageRepository
} from '../modules/asset/repositories/asset.repository.js';

const databaseEnabled = shouldLoadDatabaseModule();
const databaseEntities = [
  AdminEntity,
  AdminRoleAssignmentEntity,
  AdminSessionEntity,
  AuditLogEntity,
  PermissionEntity,
  RolePermissionAssignmentEntity,
  RoleEntity,
  MenuEntity,
  AssetFolderEntity,
  AssetImageEntity
];

/** 统一装配数据库和内存持久化实现。 */
@Global()
@Module({
  imports: [
    ...(databaseEnabled ? [DatabaseModule] : []),
    ...(databaseEnabled ? [TypeOrmModule.forFeature(databaseEntities)] : [])
  ],
  providers: [
    {
      provide: ADMIN_REPOSITORY,
      useClass: databaseEnabled ? TypeOrmAdminRepository : InMemoryAdminRepository
    },
    {
      provide: ADMIN_TRANSACTION_RUNNER,
      useClass: databaseEnabled ? TypeOrmAdminTransactionRunner : InMemoryAdminTransactionRunner
    },
    {
      provide: AUTH_SESSION_REPOSITORY,
      useClass: databaseEnabled ? TypeOrmAuthSessionRepository : InMemoryAuthSessionRepository
    },
    {
      provide: ROLE_REPOSITORY,
      useClass: databaseEnabled ? TypeOrmRoleRepository : InMemoryRoleRepository
    },
    {
      provide: PERMISSION_REPOSITORY,
      useClass: databaseEnabled ? TypeOrmPermissionRepository : InMemoryPermissionRepository
    },
    {
      provide: MENU_REPOSITORY,
      useClass: databaseEnabled ? TypeOrmMenuRepository : InMemoryMenuRepository
    },
    {
      provide: ASSET_FOLDER_REPOSITORY,
      useClass: databaseEnabled ? TypeOrmAssetFolderRepository : InMemoryAssetFolderRepository
    },
    {
      provide: ASSET_IMAGE_REPOSITORY,
      useClass: databaseEnabled ? TypeOrmAssetImageRepository : InMemoryAssetImageRepository
    }
  ],
  exports: [
    ADMIN_REPOSITORY,
    ADMIN_TRANSACTION_RUNNER,
    AUTH_SESSION_REPOSITORY,
    ROLE_REPOSITORY,
    PERMISSION_REPOSITORY,
    MENU_REPOSITORY,
    ASSET_FOLDER_REPOSITORY,
    ASSET_IMAGE_REPOSITORY
  ]
})
export class PersistenceModule {}
