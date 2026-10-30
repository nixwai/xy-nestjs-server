import { Test, type TestingModuleBuilder } from '@nestjs/testing';
import { AppModule } from '../../src/app.module.js';
import {
  ADMIN_REPOSITORY,
  ADMIN_TRANSACTION_RUNNER,
} from '../../src/modules/admin/repositories/admin-repository.port.js';
import { InMemoryAdminRepository } from '../../src/modules/admin/repositories/in-memory-admin.repository.js';
import { InMemoryAdminTransactionRunner } from '../../src/modules/admin/repositories/in-memory-admin-transaction-runner.js';
import { AUTH_SESSION_REPOSITORY } from '../../src/modules/auth/repositories/auth-session-repository.port.js';
import { InMemoryAuthSessionRepository } from '../../src/modules/auth/repositories/in-memory-auth-session.repository.js';
import { ROLE_REPOSITORY } from '../../src/modules/role/repositories/role-repository.port.js';
import { InMemoryRoleRepository } from '../../src/modules/role/repositories/in-memory-role.repository.js';
import { PERMISSION_REPOSITORY } from '../../src/modules/permission/repositories/permission-repository.port.js';
import { InMemoryPermissionRepository } from '../../src/modules/permission/repositories/in-memory-permission.repository.js';

/** 创建不依赖数据库的端到端测试模块。 */
export function createTestModule(): TestingModuleBuilder {
  const adminRepository = new InMemoryAdminRepository();
  return Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(ADMIN_REPOSITORY)
    .useValue(adminRepository)
    .overrideProvider(ADMIN_TRANSACTION_RUNNER)
    .useValue(new InMemoryAdminTransactionRunner(adminRepository))
    .overrideProvider(AUTH_SESSION_REPOSITORY)
    .useValue(new InMemoryAuthSessionRepository())
    .overrideProvider(ROLE_REPOSITORY)
    .useValue(new InMemoryRoleRepository())
    .overrideProvider(PERMISSION_REPOSITORY)
    .useValue(new InMemoryPermissionRepository());
}
