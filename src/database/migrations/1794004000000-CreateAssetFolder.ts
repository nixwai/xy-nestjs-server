import type { MigrationInterface, QueryRunner } from 'typeorm';

/** 创建素材文件夹层级、拥有者和创建者关系。 */
export class CreateAssetFolder1794004000000 implements MigrationInterface {
  name = 'CreateAssetFolder1794004000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'CREATE TABLE `asset_folder` (`id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, `parent_id` bigint UNSIGNED NULL, `parent_scope` bigint UNSIGNED GENERATED ALWAYS AS (IFNULL(`parent_id`,0)) STORED, `name` varchar(128) COLLATE utf8mb4_bin NOT NULL, `owner_admin_id` bigint UNSIGNED NOT NULL, `creator_admin_id` bigint UNSIGNED NOT NULL, `deleted_at` datetime(6) NULL, `gmt_create` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), `gmt_modified` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), `active_marker` int GENERATED ALWAYS AS (IF(`deleted_at` IS NULL,1,NULL)) STORED, INDEX `idx_asset_folder_owner_deleted` (`owner_admin_id`, `deleted_at`), INDEX `idx_asset_folder_parent_deleted` (`parent_id`, `deleted_at`), UNIQUE INDEX `uk_asset_folder_parent_name` (`owner_admin_id`, `parent_scope`, `name`, `active_marker`), PRIMARY KEY (`id`)) ENGINE=InnoDB'
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE `asset_folder`');
  }
}
