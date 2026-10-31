import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { shouldLoadDatabaseModule } from '../../config/configuration.js';
import { AuditLogEntity } from './entities/audit-log.entity.js';
import { AuditService } from './audit.service.js';
import { AuditController } from './audit.controller.js';

const databaseEnabled = shouldLoadDatabaseModule();

/** 审计模块。 */
@Module({
  imports: databaseEnabled ? [TypeOrmModule.forFeature([AuditLogEntity])] : [],
  controllers: [AuditController],
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}
