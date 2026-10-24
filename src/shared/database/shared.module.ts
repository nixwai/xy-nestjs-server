import { Global, Module } from '@nestjs/common';
import { shouldLoadDatabaseModule } from '../../config/configuration.js';
import { DatabaseModule } from './database.module.js';

const databaseModuleEnabled = shouldLoadDatabaseModule();

/** 根据运行环境提供可选的全局数据库基础设施。 */
@Global()
@Module({
  imports: databaseModuleEnabled ? [DatabaseModule] : [],
  exports: databaseModuleEnabled ? [DatabaseModule] : [],
})
export class SharedModule {}
