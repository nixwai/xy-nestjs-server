import { getMetadataArgsStorage } from 'typeorm';
import { describe, expect, it } from 'vitest';
import { UserSessionEntity } from '#/modules/user/entities/user-session.entity.js';

const metadata = getMetadataArgsStorage();
const entityColumns = metadata.columns.filter(item => item.target === UserSessionEntity);
const entityIndices = metadata.indices.filter(item => item.target === UserSessionEntity);

/** 读取用户会话实体属性对应的列定义。 */
function columnOf(propertyName: string) {
  const column = entityColumns.find(item => item.propertyName === propertyName);
  if (!column) throw new Error(`缺少列定义：${propertyName}`);
  return column;
}

describe('UserSessionEntity 元数据', () => {
  it('表名和唯一约束与用户会话表一致', () => {
    const table = metadata.tables.find(item => item.target === UserSessionEntity);
    const tokenIndex = entityIndices.find(item => item.name === 'uk_user_session_token_hash');

    expect(table?.name).toBe('user_session');
    expect(tokenIndex?.unique).toBe(true);
    expect(tokenIndex?.columns).toEqual(['tokenHash']);
  });

  it('用户主键和会话链路字段使用无符号 bigint', () => {
    for (const propertyName of ['id', 'userId', 'replacedBySessionId']) {
      const options = columnOf(propertyName).options;

      expect(options.type, propertyName).toBe('bigint');
      expect(options.unsigned, propertyName).toBe(true);
    }
  });

  it('撤销和替换字段允许为空', () => {
    expect(columnOf('revokedAt').options.nullable).toBe(true);
    expect(columnOf('replacedBySessionId').options.nullable).toBe(true);
    expect(columnOf('lastUsedAt').options.nullable).toBe(true);
  });
});
