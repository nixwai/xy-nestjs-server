import type { MigrationInterface, QueryRunner } from 'typeorm';
import { Table, TableIndex } from 'typeorm';

/** 创建后台菜单配置表。 */
export class CreateMenuTable2026103100002 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'menu',
        columns: [
          {
            name: 'id',
            type: 'bigint',
            unsigned: true,
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment'
          },
          { name: 'parent_id', type: 'bigint', unsigned: true, isNullable: true },
          { name: 'title', type: 'varchar', length: '128' },
          { name: 'path', type: 'varchar', length: '255' },
          { name: 'icon', type: 'varchar', length: '128', isNullable: true },
          { name: 'order', type: 'int', default: 0 },
          { name: 'permission_code', type: 'varchar', length: '128', isNullable: true },
          { name: 'is_active', type: 'tinyint', unsigned: true, default: 1 },
          { name: 'deleted_at', type: 'datetime', isNullable: true },
          { name: 'gmt_create', type: 'datetime', default: 'CURRENT_TIMESTAMP' },
          { name: 'gmt_modified', type: 'datetime', default: 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' }
        ]
      })
    );
    await queryRunner.createIndex('menu', new TableIndex({ name: 'idx_menu_parent_id', columnNames: ['parent_id'] }));
    await queryRunner.createIndex('menu', new TableIndex({ name: 'idx_menu_deleted_at', columnNames: ['deleted_at'] }));
  }
  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('menu', true, true, true);
  }
}
