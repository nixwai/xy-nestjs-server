import type { MigrationInterface, QueryRunner } from "typeorm";

export class Initial1793785310578 implements MigrationInterface {
    name = 'Initial1793785310578'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`admin_role_assignment\` (\`id\` bigint UNSIGNED NOT NULL AUTO_INCREMENT, \`admin_id\` bigint UNSIGNED NOT NULL, \`role_id\` bigint UNSIGNED NOT NULL, \`gmt_create\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`gmt_modified\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), INDEX \`idx_admin_role_assignment_role_id\` (\`role_id\`), UNIQUE INDEX \`uk_admin_role_assignment_admin_id_role_id\` (\`admin_id\`, \`role_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`admin_session\` (\`id\` bigint UNSIGNED NOT NULL AUTO_INCREMENT, \`admin_id\` bigint UNSIGNED NOT NULL, \`token_hash\` char(64) NOT NULL, \`expires_at\` datetime NOT NULL, \`revoked_at\` datetime NULL, \`replaced_by_session_id\` bigint UNSIGNED NULL, \`gmt_create\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`gmt_modified\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`last_used_at\` datetime NULL, INDEX \`idx_admin_session_replaced_by_session_id\` (\`replaced_by_session_id\`), INDEX \`idx_admin_session_expires_at\` (\`expires_at\`), INDEX \`idx_admin_session_admin_id\` (\`admin_id\`), UNIQUE INDEX \`uk_admin_session_token_hash\` (\`token_hash\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`audit_log\` (\`id\` bigint UNSIGNED NOT NULL AUTO_INCREMENT, \`actor_admin_id\` bigint UNSIGNED NULL, \`action\` varchar(64) NOT NULL, \`resource_type\` varchar(64) NOT NULL, \`target_id\` varchar(64) NULL, \`details\` json NULL, \`succeeded\` tinyint UNSIGNED NOT NULL DEFAULT '1', \`gmt_create\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`gmt_modified\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), INDEX \`idx_audit_log_actor_admin_id\` (\`actor_admin_id\`), INDEX \`idx_audit_log_resource_type_target_id\` (\`resource_type\`, \`target_id\`), INDEX \`idx_audit_log_cursor\` (\`gmt_create\`, \`id\`), INDEX \`idx_audit_log_created_at\` (\`gmt_create\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`menu\` (\`id\` bigint UNSIGNED NOT NULL AUTO_INCREMENT, \`parent_id\` bigint UNSIGNED NULL, \`title\` varchar(128) NOT NULL, \`path\` varchar(255) NOT NULL, \`icon\` varchar(128) NULL, \`order\` int NOT NULL DEFAULT '0', \`permission_code\` varchar(128) NULL, \`is_root_only\` tinyint UNSIGNED NOT NULL DEFAULT '0', \`is_active\` tinyint UNSIGNED NOT NULL DEFAULT '1', \`deleted_at\` datetime(6) NULL, \`gmt_create\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`gmt_modified\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), INDEX \`idx_menu_deleted_at\` (\`deleted_at\`), INDEX \`idx_menu_parent_id\` (\`parent_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`admin\` (\`id\` bigint UNSIGNED NOT NULL AUTO_INCREMENT, \`username\` varchar(64) COLLATE "utf8mb4_bin" NOT NULL, \`password_hash\` varchar(128) NOT NULL, \`password_salt\` varchar(32) NOT NULL, \`is_active\` tinyint UNSIGNED NOT NULL DEFAULT '1', \`is_root\` tinyint UNSIGNED NOT NULL DEFAULT '0', \`deleted_at\` datetime(6) NULL, \`gmt_create\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`gmt_modified\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), INDEX \`idx_admin_page\` (\`deleted_at\`, \`gmt_create\`, \`id\`), INDEX \`idx_admin_deleted_at\` (\`deleted_at\`), UNIQUE INDEX \`uk_admin_username\` (\`username\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`permission\` (\`id\` bigint UNSIGNED NOT NULL AUTO_INCREMENT, \`code\` varchar(128) NOT NULL, \`name\` varchar(128) NOT NULL, \`description\` varchar(255) NULL, \`category\` varchar(64) NOT NULL, \`is_assignable\` tinyint UNSIGNED NOT NULL DEFAULT '1', \`is_protected\` tinyint UNSIGNED NOT NULL DEFAULT '0', \`is_active\` tinyint UNSIGNED NOT NULL DEFAULT '1', \`gmt_create\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`gmt_modified\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), INDEX \`idx_permission_category_active\` (\`category\`, \`is_active\`), UNIQUE INDEX \`uk_permission_code\` (\`code\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`role\` (\`id\` bigint UNSIGNED NOT NULL AUTO_INCREMENT, \`code\` varchar(64) NOT NULL, \`name\` varchar(128) NOT NULL, \`description\` varchar(255) NULL, \`is_active\` tinyint UNSIGNED NOT NULL DEFAULT '1', \`is_system\` tinyint UNSIGNED NOT NULL DEFAULT '0', \`is_protected\` tinyint UNSIGNED NOT NULL DEFAULT '0', \`deleted_at\` datetime(6) NULL, \`gmt_create\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`gmt_modified\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), INDEX \`idx_role_page\` (\`deleted_at\`, \`gmt_create\`, \`id\`), INDEX \`idx_role_deleted_at\` (\`deleted_at\`), UNIQUE INDEX \`uk_role_code\` (\`code\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`role_permission_assignment\` (\`id\` bigint UNSIGNED NOT NULL AUTO_INCREMENT, \`role_id\` bigint UNSIGNED NOT NULL, \`permission_id\` bigint UNSIGNED NOT NULL, \`gmt_create\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`gmt_modified\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), INDEX \`idx_role_permission_assignment_permission_id\` (\`permission_id\`), UNIQUE INDEX \`uk_role_permission_assignment_role_id_permission_id\` (\`role_id\`, \`permission_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX \`uk_role_permission_assignment_role_id_permission_id\` ON \`role_permission_assignment\``);
        await queryRunner.query(`DROP INDEX \`idx_role_permission_assignment_permission_id\` ON \`role_permission_assignment\``);
        await queryRunner.query(`DROP TABLE \`role_permission_assignment\``);
        await queryRunner.query(`DROP INDEX \`uk_role_code\` ON \`role\``);
        await queryRunner.query(`DROP INDEX \`idx_role_deleted_at\` ON \`role\``);
        await queryRunner.query(`DROP INDEX \`idx_role_page\` ON \`role\``);
        await queryRunner.query(`DROP TABLE \`role\``);
        await queryRunner.query(`DROP INDEX \`uk_permission_code\` ON \`permission\``);
        await queryRunner.query(`DROP INDEX \`idx_permission_category_active\` ON \`permission\``);
        await queryRunner.query(`DROP TABLE \`permission\``);
        await queryRunner.query(`DROP INDEX \`uk_admin_username\` ON \`admin\``);
        await queryRunner.query(`DROP INDEX \`idx_admin_deleted_at\` ON \`admin\``);
        await queryRunner.query(`DROP INDEX \`idx_admin_page\` ON \`admin\``);
        await queryRunner.query(`DROP TABLE \`admin\``);
        await queryRunner.query(`DROP INDEX \`idx_menu_parent_id\` ON \`menu\``);
        await queryRunner.query(`DROP INDEX \`idx_menu_deleted_at\` ON \`menu\``);
        await queryRunner.query(`DROP TABLE \`menu\``);
        await queryRunner.query(`DROP INDEX \`idx_audit_log_created_at\` ON \`audit_log\``);
        await queryRunner.query(`DROP INDEX \`idx_audit_log_cursor\` ON \`audit_log\``);
        await queryRunner.query(`DROP INDEX \`idx_audit_log_resource_type_target_id\` ON \`audit_log\``);
        await queryRunner.query(`DROP INDEX \`idx_audit_log_actor_admin_id\` ON \`audit_log\``);
        await queryRunner.query(`DROP TABLE \`audit_log\``);
        await queryRunner.query(`DROP INDEX \`uk_admin_session_token_hash\` ON \`admin_session\``);
        await queryRunner.query(`DROP INDEX \`idx_admin_session_admin_id\` ON \`admin_session\``);
        await queryRunner.query(`DROP INDEX \`idx_admin_session_expires_at\` ON \`admin_session\``);
        await queryRunner.query(`DROP INDEX \`idx_admin_session_replaced_by_session_id\` ON \`admin_session\``);
        await queryRunner.query(`DROP TABLE \`admin_session\``);
        await queryRunner.query(`DROP INDEX \`uk_admin_role_assignment_admin_id_role_id\` ON \`admin_role_assignment\``);
        await queryRunner.query(`DROP INDEX \`idx_admin_role_assignment_role_id\` ON \`admin_role_assignment\``);
        await queryRunner.query(`DROP TABLE \`admin_role_assignment\``);
    }

}
