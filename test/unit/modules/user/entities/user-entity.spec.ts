import { getMetadataArgsStorage, type QueryRunner } from 'typeorm';
import { describe, expect, it, vi } from 'vitest';
import { CreateUserManagement1794005000000 } from '#/database/migrations/1794005000000-CreateUserManagement.js';
import { UserEntity } from '#/modules/user/entities/user.entity.js';

const entityColumns = getMetadataArgsStorage().columns.filter(item => item.target === UserEntity);

/** 读取用户实体属性对应的列定义。 */
function columnOf(propertyName: string) {
  const column = entityColumns.find(item => item.propertyName === propertyName);
  if (!column) throw new Error(`缺少列定义：${propertyName}`);
  return column;
}

describe('UserEntity 元数据', () => {
  it('微信身份字段允许为空以支持非微信登录方式', () => {
    expect(columnOf('openId').options.nullable).toBe(true);
    expect(columnOf('unionId').options.nullable).toBe(true);
  });

  it('用户管理迁移创建可空的微信身份字段', async () => {
    const query = vi.fn().mockResolvedValue(undefined);
    const queryRunner = { query } as unknown as QueryRunner;

    await new CreateUserManagement1794005000000().up(queryRunner);

    const createUserSql = query.mock.calls[0]?.[0];
    expect(createUserSql).toContain('`open_id` varchar(64) COLLATE utf8mb4_bin NULL');
    expect(createUserSql).toContain('`union_id` varchar(64) COLLATE utf8mb4_bin NULL');
  });
});
