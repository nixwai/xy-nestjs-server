import { Global, Module } from '@nestjs/common';
import { shouldLoadDatabaseModule } from '../../config/configuration.js';
import { DatabaseModule } from './database.module.js';

const databaseModuleEnabled = shouldLoadDatabaseModule();

/** 全局共享基础设施模块。 */
@Global()
@Module({
  imports: databaseModuleEnabled ? [DatabaseModule] : [],
  exports: databaseModuleEnabled ? [DatabaseModule] : [],
})
export class SharedModule {}
