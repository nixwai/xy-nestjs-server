import { MigrationInterface, QueryRunner, TableIndex } from 'typeorm';

/** 为页码分页和审计游标查询增加组合索引。 */
export class AddPaginationIndexes2026110200003 implements MigrationInterface {
  /** 创建分页查询使用的组合索引。 */
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createIndex(
      'admin',
      new TableIndex({
        name: 'idx_admin_page',
        columnNames: ['deleted_at', 'gmt_create', 'id'],
      }),
    );
    await queryRunner.createIndex(
      'role',
      new TableIndex({
        name: 'idx_role_page',
        columnNames: ['deleted_at', 'gmt_create', 'id'],
      }),
    );
    await queryRunner.createIndex(
      'audit_log',
      new TableIndex({
        name: 'idx_audit_log_cursor',
        columnNames: ['gmt_create', 'id'],
      }),
    );
  }

  /** 删除分页查询使用的组合索引。 */
  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('audit_log', 'idx_audit_log_cursor');
    await queryRunner.dropIndex('role', 'idx_role_page');
    await queryRunner.dropIndex('admin', 'idx_admin_page');
  }
}
