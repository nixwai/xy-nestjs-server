import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAssetManagement1794003000000 implements MigrationInterface {
  name = 'CreateAssetManagement1794003000000';
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE \`asset_folder\` (\`id\` bigint UNSIGNED NOT NULL AUTO_INCREMENT, \`parent_id\` bigint UNSIGNED NULL, \`name\` varchar(128) COLLATE utf8mb4_0900_bin NOT NULL, \`owner_admin_id\` bigint UNSIGNED NOT NULL, \`created_by_admin_id\` bigint UNSIGNED NOT NULL, \`deleted_at\` datetime(6) NULL, \`gmt_create\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`gmt_modified\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), INDEX \`idx_asset_folder_owner_deleted\` (\`owner_admin_id\`, \`deleted_at\`), INDEX \`idx_asset_folder_parent_deleted\` (\`parent_id\`, \`deleted_at\`), \`parent_scope\` bigint UNSIGNED GENERATED ALWAYS AS (IFNULL(\`parent_id\`,0)) STORED, \`active_marker\` int GENERATED ALWAYS AS (IF(\`deleted_at\` IS NULL,1,NULL)) STORED, UNIQUE INDEX \`uk_asset_folder_parent_name\` (\`owner_admin_id\`, \`parent_scope\`, \`name\`, \`active_marker\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
    await queryRunner.query(`CREATE TABLE \`asset_image\` (\`id\` bigint UNSIGNED NOT NULL AUTO_INCREMENT, \`folder_id\` bigint UNSIGNED NULL, \`original_name\` varchar(255) COLLATE utf8mb4_0900_bin NOT NULL, \`storage_key\` varchar(512) COLLATE utf8mb4_0900_bin NOT NULL, \`url\` varchar(1024) NOT NULL, \`mime_type\` varchar(128) NOT NULL, \`size\` bigint UNSIGNED NOT NULL, \`width\` int NULL, \`height\` int NULL, \`owner_admin_id\` bigint UNSIGNED NOT NULL, \`created_by_admin_id\` bigint UNSIGNED NOT NULL, \`deleted_at\` datetime(6) NULL, \`gmt_create\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`gmt_modified\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), INDEX \`idx_asset_image_owner_created\` (\`owner_admin_id\`, \`gmt_create\`, \`id\`), INDEX \`idx_asset_image_folder_created\` (\`folder_id\`, \`gmt_create\`, \`id\`), INDEX \`idx_asset_image_deleted\` (\`deleted_at\`), INDEX \`idx_asset_image_original_name\` (\`original_name\`), UNIQUE INDEX \`uk_asset_image_storage_key\` (\`storage_key\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
  }
  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE `asset_image`');
    await queryRunner.query('DROP TABLE `asset_folder`');
  }
}
