import type { MigrationInterface, QueryRunner } from 'typeorm';

/** 创建微信用户及刷新令牌会话表。 */
export class CreateUserManagement1794005000000 implements MigrationInterface {
  name = 'CreateUserManagement1794005000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query("CREATE TABLE `user` (`id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, `open_id` varchar(64) COLLATE utf8mb4_bin NULL, `union_id` varchar(64) COLLATE utf8mb4_bin NULL, `nickname` varchar(128) NULL, `avatar_url` varchar(512) NULL, `is_active` tinyint UNSIGNED NOT NULL DEFAULT '1', `last_login_at` datetime NULL, `deleted_at` datetime(6) NULL, `gmt_create` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), `gmt_modified` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), INDEX `idx_user_deleted_at` (`deleted_at`), INDEX `idx_user_status_created_at` (`is_active`, `gmt_create`, `id`), UNIQUE INDEX `uk_user_open_id` (`open_id`), PRIMARY KEY (`id`)) ENGINE=InnoDB");
    await queryRunner.query("CREATE TABLE `user_session` (`id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, `user_id` bigint UNSIGNED NOT NULL, `session_family_id` char(36) NOT NULL, `token_hash` char(64) NOT NULL, `expires_at` datetime NOT NULL, `revoked_at` datetime NULL, `replaced_by_session_id` bigint UNSIGNED NULL, `gmt_create` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), `gmt_modified` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), `last_used_at` datetime NULL, INDEX `idx_user_session_user_id` (`user_id`), INDEX `idx_user_session_expires_at` (`expires_at`), INDEX `idx_user_session_replaced_by_session_id` (`replaced_by_session_id`), INDEX `idx_user_session_family_id` (`session_family_id`), UNIQUE INDEX `uk_user_session_token_hash` (`token_hash`), PRIMARY KEY (`id`)) ENGINE=InnoDB");
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query("DROP TABLE `user_session`");
    await queryRunner.query("DROP TABLE `user`");
  }
}
