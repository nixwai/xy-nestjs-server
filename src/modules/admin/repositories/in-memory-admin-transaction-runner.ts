import { Inject } from '@nestjs/common';
import { ADMIN_REPOSITORY } from './admin-repository.port.js';
import type {
  AdminRepository,
  AdminTransactionRunner,
} from './admin-repository.port.js';

/** 在内存测试仓储上执行管理员账户事务回调。 */
export class InMemoryAdminTransactionRunner implements AdminTransactionRunner {
  constructor(
    @Inject(ADMIN_REPOSITORY) private readonly repository: AdminRepository,
  ) {}

  run<T>(work: (repository: AdminRepository) => Promise<T>): Promise<T> {
    return work(this.repository);
  }
}
