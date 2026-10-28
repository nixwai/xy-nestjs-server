import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

/** 创建管理员、RBAC 和审计数据表。 */
export class CreateAdminAuthTables202610250001 implements MigrationInterface {
  /** 创建认证、授权和审计表。 */
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'admins',
        columns: [
          {
            name: 'id',
            type: 'bigint',
            unsigned: true,
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'username',
            type: 'varchar',
            length: '64',
            collation: 'utf8mb4_bin',
          },
          { name: 'password_hash', type: 'varchar', length: '128' },
          { name: 'password_salt', type: 'varchar', length: '32' },
          { name: 'is_active', type: 'tinyint', default: '1' },
          { name: 'is_super_admin', type: 'tinyint', default: '0' },
          { name: 'is_deleted', type: 'tinyint', default: '0' },
          {
            name: 'created_at',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
    );
    await queryRunner.createIndex(
      'admins',
      new TableIndex({
        name: 'uk_admins_username',
        columnNames: ['username'],
        isUnique: true,
      }),
    );
    await queryRunner.createTable(
      new Table({
        name: 'roles',
        columns: [
          {
            name: 'id',
            type: 'bigint',
            unsigned: true,
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          { name: 'code', type: 'varchar', length: '64' },
          { name: 'name', type: 'varchar', length: '128' },
          {
            name: 'description',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          { name: 'is_active', type: 'tinyint', default: '1' },
          { name: 'is_deleted', type: 'tinyint', default: '0' },
          {
            name: 'created_at',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
    );
    await queryRunner.createIndex(
      'roles',
      new TableIndex({
        name: 'uk_roles_code',
        columnNames: ['code'],
        isUnique: true,
      }),
    );
    await queryRunner.createTable(
      new Table({
        name: 'permissions',
        columns: [
          {
            name: 'id',
            type: 'bigint',
            unsigned: true,
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
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
          { name: 'is_active', type: 'tinyint', default: '1' },
          {
            name: 'created_at',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
    );
    await queryRunner.createIndex(
      'permissions',
      new TableIndex({
        name: 'uk_permissions_code',
        columnNames: ['code'],
        isUnique: true,
      }),
    );
    await queryRunner.createIndex(
      'permissions',
      new TableIndex({
        name: 'idx_permissions_resource_method',
        columnNames: ['resource', 'method'],
      }),
    );
    await queryRunner.createTable(
      new Table({
        name: 'admin_roles',
        columns: [
          {
            name: 'id',
            type: 'bigint',
            unsigned: true,
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          { name: 'admin_id', type: 'bigint', unsigned: true },
          { name: 'role_id', type: 'bigint', unsigned: true },
        ],
      }),
    );
    await queryRunner.createIndex(
      'admin_roles',
      new TableIndex({
        name: 'uk_admin_roles_admin_role',
        columnNames: ['admin_id', 'role_id'],
        isUnique: true,
      }),
    );
    await queryRunner.createTable(
      new Table({
        name: 'role_permissions',
        columns: [
          {
            name: 'id',
            type: 'bigint',
            unsigned: true,
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          { name: 'role_id', type: 'bigint', unsigned: true },
          { name: 'permission_id', type: 'bigint', unsigned: true },
        ],
      }),
    );
    await queryRunner.createIndex(
      'role_permissions',
      new TableIndex({
        name: 'uk_role_permissions_role_permission',
        columnNames: ['role_id', 'permission_id'],
        isUnique: true,
      }),
    );
    await queryRunner.createTable(
      new Table({
        name: 'admin_sessions',
        columns: [
          {
            name: 'id',
            type: 'bigint',
            unsigned: true,
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
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
            name: 'created_at',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
          },
          { name: 'last_used_at', type: 'datetime', isNullable: true },
        ],
      }),
    );
    await queryRunner.createIndex(
      'admin_sessions',
      new TableIndex({
        name: 'uk_admin_sessions_token_hash',
        columnNames: ['token_hash'],
        isUnique: true,
      }),
    );
    await queryRunner.createIndex(
      'admin_sessions',
      new TableIndex({
        name: 'idx_admin_sessions_admin_id',
        columnNames: ['admin_id'],
      }),
    );
    await queryRunner.createIndex(
      'admin_sessions',
      new TableIndex({
        name: 'idx_admin_sessions_expires_at',
        columnNames: ['expires_at'],
      }),
    );
    await queryRunner.createTable(
      new Table({
        name: 'audit_logs',
        columns: [
          {
            name: 'id',
            type: 'bigint',
            unsigned: true,
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
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
          { name: 'succeeded', type: 'tinyint', default: '1' },
          {
            name: 'created_at',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
    );
    await queryRunner.createIndex(
      'audit_logs',
      new TableIndex({
        name: 'idx_audit_logs_created_at',
        columnNames: ['created_at'],
      }),
    );
    await queryRunner.createIndex(
      'audit_logs',
      new TableIndex({
        name: 'idx_audit_logs_resource_target',
        columnNames: ['resource_type', 'target_id'],
      }),
    );
    await queryRunner.createForeignKey(
      'admin_roles',
      new TableForeignKey({
        name: 'fk_admin_roles_admin',
        columnNames: ['admin_id'],
        referencedTableName: 'admins',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
    await queryRunner.createForeignKey(
      'admin_roles',
      new TableForeignKey({
        name: 'fk_admin_roles_role',
        columnNames: ['role_id'],
        referencedTableName: 'roles',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
    await queryRunner.createForeignKey(
      'role_permissions',
      new TableForeignKey({
        name: 'fk_role_permissions_role',
        columnNames: ['role_id'],
        referencedTableName: 'roles',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
    await queryRunner.createForeignKey(
      'role_permissions',
      new TableForeignKey({
        name: 'fk_role_permissions_permission',
        columnNames: ['permission_id'],
        referencedTableName: 'permissions',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
    await queryRunner.createForeignKey(
      'admin_sessions',
      new TableForeignKey({
        name: 'fk_admin_sessions_admin_id',
        columnNames: ['admin_id'],
        referencedTableName: 'admins',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
    await queryRunner.createForeignKey(
      'audit_logs',
      new TableForeignKey({
        name: 'fk_audit_logs_actor_admin',
        columnNames: ['actor_admin_id'],
        referencedTableName: 'admins',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );
  }
  /** 删除认证、授权和审计表。 */
  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('audit_logs', true, true, true);
    await queryRunner.dropTable('admin_sessions', true, true, true);
    await queryRunner.dropTable('role_permissions', true, true, true);
    await queryRunner.dropTable('admin_roles', true, true, true);
    await queryRunner.dropTable('permissions', true, true, true);
    await queryRunner.dropTable('roles', true, true, true);
    await queryRunner.dropTable('admins', true, true, true);
  }
}
