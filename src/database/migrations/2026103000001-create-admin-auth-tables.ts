import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

/** 创建管理员、RBAC 和审计数据表。 */
export class CreateAdminAuthTables2026103000001 implements MigrationInterface {
  /** 创建认证、授权和审计表。 */
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'admin',
        columns: [
          {
            name: 'id',
            type: 'bigint',
            unsigned: true,
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
            primaryKeyConstraintName: 'pk_admin_id',
          },
          {
            name: 'username',
            type: 'varchar',
            length: '64',
            collation: 'utf8mb4_bin',
          },
          { name: 'password_hash', type: 'varchar', length: '128' },
          { name: 'password_salt', type: 'varchar', length: '32' },
          { name: 'is_active', type: 'tinyint', unsigned: true, default: '1' },
          {
            name: 'is_super_admin',
            type: 'tinyint',
            unsigned: true,
            default: '0',
          },
          { name: 'deleted_at', type: 'datetime', isNullable: true },
          {
            name: 'gmt_create',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'gmt_modified',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
    );
    await queryRunner.createIndex(
      'admin',
      new TableIndex({
        name: 'uk_admin_username',
        columnNames: ['username'],
        isUnique: true,
      }),
    );
    await queryRunner.createIndex(
      'admin',
      new TableIndex({
        name: 'idx_admin_deleted_at',
        columnNames: ['deleted_at'],
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'role',
        columns: [
          {
            name: 'id',
            type: 'bigint',
            unsigned: true,
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
            primaryKeyConstraintName: 'pk_role_id',
          },
          { name: 'code', type: 'varchar', length: '64' },
          { name: 'name', type: 'varchar', length: '128' },
          {
            name: 'description',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          { name: 'is_active', type: 'tinyint', unsigned: true, default: '1' },
          { name: 'deleted_at', type: 'datetime', isNullable: true },
          {
            name: 'gmt_create',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'gmt_modified',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
    );
    await queryRunner.createIndex(
      'role',
      new TableIndex({
        name: 'uk_role_code',
        columnNames: ['code'],
        isUnique: true,
      }),
    );
    await queryRunner.createIndex(
      'role',
      new TableIndex({
        name: 'idx_role_deleted_at',
        columnNames: ['deleted_at'],
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'permission',
        columns: [
          {
            name: 'id',
            type: 'bigint',
            unsigned: true,
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
            primaryKeyConstraintName: 'pk_permission_id',
          },
          { name: 'code', type: 'varchar', length: '128' },
          { name: 'resource', type: 'varchar', length: '64' },
          { name: 'method', type: 'varchar', length: '16' },
          { name: 'name', type: 'varchar', length: '128' },
          {
            name: 'description',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          { name: 'is_active', type: 'tinyint', unsigned: true, default: '1' },
          {
            name: 'gmt_create',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'gmt_modified',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
    );
    await queryRunner.createIndex(
      'permission',
      new TableIndex({
        name: 'uk_permission_code',
        columnNames: ['code'],
        isUnique: true,
      }),
    );
    await queryRunner.createIndex(
      'permission',
      new TableIndex({
        name: 'idx_permission_resource_method',
        columnNames: ['resource', 'method'],
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'admin_role_assignment',
        columns: [
          {
            name: 'id',
            type: 'bigint',
            unsigned: true,
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
            primaryKeyConstraintName: 'pk_admin_role_assignment_id',
          },
          { name: 'admin_id', type: 'bigint', unsigned: true },
          { name: 'role_id', type: 'bigint', unsigned: true },
          {
            name: 'gmt_create',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'gmt_modified',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
    );
    await queryRunner.createIndex(
      'admin_role_assignment',
      new TableIndex({
        name: 'uk_admin_role_assignment_admin_id_role_id',
        columnNames: ['admin_id', 'role_id'],
        isUnique: true,
      }),
    );
    await queryRunner.createIndex(
      'admin_role_assignment',
      new TableIndex({
        name: 'idx_admin_role_assignment_role_id',
        columnNames: ['role_id'],
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'role_permission_assignment',
        columns: [
          {
            name: 'id',
            type: 'bigint',
            unsigned: true,
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
            primaryKeyConstraintName: 'pk_role_permission_assignment_id',
          },
          { name: 'role_id', type: 'bigint', unsigned: true },
          { name: 'permission_id', type: 'bigint', unsigned: true },
          {
            name: 'gmt_create',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'gmt_modified',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
    );
    await queryRunner.createIndex(
      'role_permission_assignment',
      new TableIndex({
        name: 'uk_role_permission_assignment_role_id_permission_id',
        columnNames: ['role_id', 'permission_id'],
        isUnique: true,
      }),
    );
    await queryRunner.createIndex(
      'role_permission_assignment',
      new TableIndex({
        name: 'idx_role_permission_assignment_permission_id',
        columnNames: ['permission_id'],
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'admin_session',
        columns: [
          {
            name: 'id',
            type: 'bigint',
            unsigned: true,
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
            primaryKeyConstraintName: 'pk_admin_session_id',
          },
          { name: 'admin_id', type: 'bigint', unsigned: true },
          { name: 'token_hash', type: 'char', length: '64' },
          { name: 'expires_at', type: 'datetime' },
          { name: 'revoked_at', type: 'datetime', isNullable: true },
          {
            name: 'replaced_by_session_id',
            type: 'bigint',
            unsigned: true,
            isNullable: true,
          },
          {
            name: 'gmt_create',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'gmt_modified',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
          { name: 'last_used_at', type: 'datetime', isNullable: true },
        ],
      }),
    );
    await queryRunner.createIndex(
      'admin_session',
      new TableIndex({
        name: 'uk_admin_session_token_hash',
        columnNames: ['token_hash'],
        isUnique: true,
      }),
    );
    await queryRunner.createIndex(
      'admin_session',
      new TableIndex({
        name: 'idx_admin_session_admin_id',
        columnNames: ['admin_id'],
      }),
    );
    await queryRunner.createIndex(
      'admin_session',
      new TableIndex({
        name: 'idx_admin_session_expires_at',
        columnNames: ['expires_at'],
      }),
    );
    await queryRunner.createIndex(
      'admin_session',
      new TableIndex({
        name: 'idx_admin_session_replaced_by_session_id',
        columnNames: ['replaced_by_session_id'],
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'audit_log',
        columns: [
          {
            name: 'id',
            type: 'bigint',
            unsigned: true,
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
            primaryKeyConstraintName: 'pk_audit_log_id',
          },
          {
            name: 'actor_admin_id',
            type: 'bigint',
            unsigned: true,
            isNullable: true,
          },
          { name: 'action', type: 'varchar', length: '64' },
          { name: 'resource_type', type: 'varchar', length: '64' },
          {
            name: 'target_id',
            type: 'varchar',
            length: '64',
            isNullable: true,
          },
          { name: 'details', type: 'json', isNullable: true },
          { name: 'succeeded', type: 'tinyint', unsigned: true, default: '1' },
          {
            name: 'gmt_create',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'gmt_modified',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
    );
    await queryRunner.createIndex(
      'audit_log',
      new TableIndex({
        name: 'idx_audit_log_created_at',
        columnNames: ['gmt_create'],
      }),
    );
    await queryRunner.createIndex(
      'audit_log',
      new TableIndex({
        name: 'idx_audit_log_resource_type_target_id',
        columnNames: ['resource_type', 'target_id'],
      }),
    );
    await queryRunner.createIndex(
      'audit_log',
      new TableIndex({
        name: 'idx_audit_log_actor_admin_id',
        columnNames: ['actor_admin_id'],
      }),
    );
  }

  /** 删除认证、授权和审计表。 */
  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('audit_log', true, true, true);
    await queryRunner.dropTable('admin_session', true, true, true);
    await queryRunner.dropTable('role_permission_assignment', true, true, true);
    await queryRunner.dropTable('admin_role_assignment', true, true, true);
    await queryRunner.dropTable('permission', true, true, true);
    await queryRunner.dropTable('role', true, true, true);
    await queryRunner.dropTable('admin', true, true, true);
  }
}
