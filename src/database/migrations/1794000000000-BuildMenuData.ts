import type { MigrationInterface, QueryRunner } from 'typeorm';

/** 重建菜单基础数据。 */
export class RebuildMenuData1794000000000 implements MigrationInterface {
  name = 'RebuildMenuData1794000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.manager.transaction(async manager => {
      await manager.query(`
        INSERT INTO \`menu\`
          (\`menu_key\`, \`parent_key\`, \`title\`, \`path\`, \`order\`, \`permission_code\`, \`is_root_only\`, \`is_active\`)
        VALUES ('home', NULL, '工作台', '/home', 1, NULL, 0, 1)
      `);
    });
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.manager.transaction(async manager => {
      await manager.query('DELETE FROM `menu`');
    });
  }
}