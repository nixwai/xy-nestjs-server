import { Inject, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AdminRoleEntity } from '../entities/admin-role.entity.js';
import { AdminSessionEntity } from '../entities/admin-session.entity.js';
import { AdminEntity } from '../entities/admin.entity.js';
import { ADMIN_REPOSITORY } from './admin-repository.port.js';
import type {
  AdminRepository,
  AdminTransactionRunner,
} from './admin-repository.port.js';
import { TypeOrmAdminRepository } from './typeorm-admin.repository.js';

/** 使用 TypeORM 事务执行管理员账户的跨步骤写入。 */
@Injectable()
export class TypeOrmAdminTransactionRunner implements AdminTransactionRunner {
  constructor(private readonly dataSource: DataSource) {}

  async run<T>(work: (repository: AdminRepository) => Promise<T>): Promise<T> {
    return this.dataSource.transaction(async (manager) =>
      work(
        new TypeOrmAdminRepository(
          manager.getRepository(AdminEntity),
          manager.getRepository(AdminRoleEntity),
          manager.getRepository(AdminSessionEntity),
        ),
      ),
    );
  }
}

/** 在内存测试仓储上执行管理员账户事务回调。 */
export class InMemoryAdminTransactionRunner implements AdminTransactionRunner {
  constructor(
    @Inject(ADMIN_REPOSITORY) private readonly repository: AdminRepository,
  ) {}

  run<T>(work: (repository: AdminRepository) => Promise<T>): Promise<T> {
    return work(this.repository);
  }
}
