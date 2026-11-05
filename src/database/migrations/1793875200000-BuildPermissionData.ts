import type { MigrationInterface, QueryRunner } from 'typeorm';

/** 重建权限基础数据。 */
export class RebuildPermissionData1793875200000 implements MigrationInterface {
  name = 'RebuildPermissionData1793875200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.manager.transaction(async manager => {
      await manager.query(`
        INSERT INTO \`permission\`
          (\`code\`, \`name\`, \`description\`, \`category\`, \`is_assignable\`, \`is_protected\`, \`is_active\`)
        VALUES ('system.audit.read', '查看审计', '查看管理员变更审计', 'system', 1, 0, 1)
      `);
    });
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.manager.transaction(async manager => {
      await manager.query('DELETE FROM `role_permission_assignment`');
      await manager.query('DELETE FROM `permission`');
    });
  }
}

