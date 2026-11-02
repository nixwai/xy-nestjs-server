import { Global, Module } from '@nestjs/common';
import { PersistenceModule } from '../persistence.module.js';

/** 提供全局持久化基础设施。 */
@Global()
@Module({
  imports: [PersistenceModule],
  exports: [PersistenceModule]
})
export class SharedModule {}
