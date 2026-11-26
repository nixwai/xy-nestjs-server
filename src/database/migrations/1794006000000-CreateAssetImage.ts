import type { MigrationInterface, QueryRunner } from 'typeorm';

/** 创建素材图片元数据表。 */
export class CreateAssetImage1794006000000 implements MigrationInterface {
  name = 'CreateAssetImage1794006000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'CREATE TABLE `asset_image` (`id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, `folder_id` bigint UNSIGNED NOT NULL, `owner_admin_id` bigint UNSIGNED NOT NULL, `creator_admin_id` bigint UNSIGNED NOT NULL, `original_name` varchar(255) NOT NULL, `storage_key` varchar(512) NOT NULL, `mime_type` varchar(64) NOT NULL, `size` int UNSIGNED NOT NULL, `width` int UNSIGNED NOT NULL, `height` int UNSIGNED NOT NULL, `deleted_at` datetime(6) NULL, `gmt_create` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), `gmt_modified` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), UNIQUE INDEX `uk_asset_image_storage_key` (`storage_key`), INDEX `idx_asset_image_folder_deleted_created` (`folder_id`, `deleted_at`, `gmt_create`), INDEX `idx_asset_image_owner_deleted` (`owner_admin_id`, `deleted_at`), PRIMARY KEY (`id`)) ENGINE=InnoDB'
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE `asset_image`');
  }
}
