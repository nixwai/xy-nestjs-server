import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AdminRoleAssignmentEntity } from '../entities/admin-role-assignment.entity.js';
import { AdminSessionEntity } from '../entities/admin-session.entity.js';
import { AdminEntity } from '../entities/admin.entity.js';
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
          manager.getRepository(AdminRoleAssignmentEntity),
          manager.getRepository(AdminSessionEntity),
        ),
      ),
    );
  }
}
