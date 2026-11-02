import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditModule } from '../audit/audit.module.js';
import { MenuEntity } from './entities/menu.entity.js';
import { MenuController } from './menu.controller.js';
import { MenuService } from './menu.service.js';
import { MENU_REPOSITORY } from './repositories/menu-repository.port.js';
import { InMemoryMenuRepository } from './repositories/in-memory-menu.repository.js';
import { TypeOrmMenuRepository } from './repositories/typeorm-menu.repository.js';
import { shouldLoadDatabaseModule } from '#/config/configuration.js';

const databaseEnabled = shouldLoadDatabaseModule();
@Module({
  imports: [AuditModule, ...(databaseEnabled ? [TypeOrmModule.forFeature([MenuEntity])] : [])],
  controllers: [MenuController],
  providers: [
    MenuService,
    { provide: MENU_REPOSITORY, useClass: databaseEnabled ? TypeOrmMenuRepository : InMemoryMenuRepository }
  ],
  exports: [MenuService]
})
export class MenuModule {}
