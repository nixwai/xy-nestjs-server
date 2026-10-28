import { Module } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AuditService } from './audit.service.js';
import { AuditController } from './audit.controller.js';

/** 审计模块。 */
@Module({
  controllers: [AuditController],
  providers: [
    {
      provide: AuditService,
      inject: [{ token: DataSource, optional: true }],
      useFactory: (dataSource?: DataSource) => new AuditService(dataSource),
    },
  ],
  exports: [AuditService],
})
export class AuditModule {}
