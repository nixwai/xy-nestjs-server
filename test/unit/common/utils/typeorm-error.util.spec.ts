import { QueryFailedError } from 'typeorm';
import { describe, expect, it } from 'vitest';
import { getMysqlDuplicateKey } from '#/common/utils/typeorm-error.util.js';
/** 定义 MysqlErrorOptions 数据契约。 */
interface MysqlErrorOptions {
  /** 业务编码。 */
  code?: string;
  /** 数据库错误编号。 */
  errno?: number;
  /** 响应消息。 */
  message?: string;
  /** 数据库错误消息。 */
  sqlMessage?: string;
}

/** 构造数据库查询异常 */
function createQueryFailedError(options: MysqlErrorOptions): QueryFailedError {
  const driverError = Object.assign(new Error(options.message ?? 'Duplicate entry'), options);
  return new QueryFailedError('INSERT INTO secret_table', [], driverError);
}

describe('getMysqlDuplicateKey', () => {
  it('应将已知唯一索引映射为客户端字段标识', () => {
    const error = createQueryFailedError({
      code: 'ER_DUP_ENTRY',
      sqlMessage: "Duplicate entry 'admin' for key 'uk_admin_username'"
    });

    expect(getMysqlDuplicateKey(error)).toBe('username');
  });

  it('应支持通过错误号识别重复键', () => {
    const error = createQueryFailedError({
      errno: 1062,
      message: "Duplicate entry 'secret' for key 'uk_role_code'"
    });

    expect(getMysqlDuplicateKey(error)).toBe('roleCode');
  });

  it('应移除表名前缀和引号后再解析索引名', () => {
    const error = createQueryFailedError({
      code: 'ER_DUP_ENTRY',
      message: "Duplicate entry 'secret' for key 'scenic`.`uk_permission_code'"
    });

    expect(getMysqlDuplicateKey(error)).toBe('permissionCode');
  });

  it('应为未知索引返回安全默认标识', () => {
    const error = createQueryFailedError({
      code: 'ER_DUP_ENTRY',
      sqlMessage: "Duplicate entry 'secret' for key 'IDX_unknown_internal_hash'"
    });

    expect(getMysqlDuplicateKey(error)).toBe('uniqueKey');
  });

  it('不应向客户端暴露未知的数据库索引名称', () => {
    const error = createQueryFailedError({
      code: 'ER_DUP_ENTRY',
      sqlMessage: "Duplicate entry 'secret' for key 'uk_future_internal_index'"
    });

    expect(getMysqlDuplicateKey(error)).toBe('uniqueKey');
  });

  it('应为无法解析索引名称的重复键返回安全默认标识', () => {
    const error = createQueryFailedError({
      errno: 1062,
      sqlMessage: "Duplicate entry 'secret'"
    });

    expect(getMysqlDuplicateKey(error)).toBe('uniqueKey');
  });

  it('非重复键 QueryFailedError 应返回 null', () => {
    const error = createQueryFailedError({
      code: 'ER_BAD_FIELD_ERROR',
      errno: 1054,
      sqlMessage: "Unknown column 'secret'"
    });

    expect(getMysqlDuplicateKey(error)).toBeNull();
  });

  it('非 QueryFailedError 应返回 null', () => {
    expect(getMysqlDuplicateKey(new Error('Duplicate entry'))).toBeNull();
  });

  it('不应泄露重复值、SQL 或完整错误信息', () => {
    const duplicateValue = 'private@example.com';
    const error = createQueryFailedError({
      code: 'ER_DUP_ENTRY',
      sqlMessage: `Duplicate entry '${duplicateValue}' for key 'uk_admin_username'`
    });

    const key = getMysqlDuplicateKey(error);

    expect(key).toBe('username');
    expect(key).not.toContain(duplicateValue);
    expect(key).not.toContain('INSERT');
    expect(key).not.toContain('Duplicate entry');
  });
});
