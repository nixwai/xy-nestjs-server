import { QueryFailedError } from 'typeorm';

interface MysqlDriverError {
  code?: string;
  errno?: number;
  message?: string;
  sqlMessage?: string;
}

const DUPLICATE_INDEX_KEY_MAP: Readonly<Record<string, string>> = Object.freeze(
  {
    uk_admin_username: 'username',
    uk_admin_session_token_hash: 'tokenHash',
    uk_admin_role_assignment_admin_id_role_id: 'adminRole',
    uk_role_code: 'roleCode',
    uk_permission_code: 'permissionCode',
    uk_role_permission_assignment_role_id_permission_id: 'rolePermission',
  },
);

/** 从 MySQL 错误消息中提取唯一索引名称。 */
function extractIndexName(message: string): string | null {
  const match = message.match(
    /\bfor key\s+(?:'([^']+)'|"([^"]+)"|`([^`]+)`|([^\s,;]+))/i,
  );
  const rawIndexName = match?.slice(1).find((value) => value !== undefined);
  if (!rawIndexName) {
    return null;
  }

  const indexName = rawIndexName
    .split('.')
    .at(-1)
    ?.trim()
    .replace(/^[`'"]+|[`'"]+$/g, '');

  return indexName || null;
}

/** 将数据库索引名称转换为不泄露内部结构的客户端字段标识。 */
function toSafeDuplicateKey(indexName: string): string {
  const mappedKey = DUPLICATE_INDEX_KEY_MAP[indexName];
  if (mappedKey) {
    return mappedKey;
  }

  return 'uniqueKey';
}

/** 判断值是否包含 TypeORM 查询异常的驱动错误信息。 */
function getDriverError(error: unknown): MysqlDriverError | null {
  if (!(error instanceof QueryFailedError)) {
    return null;
  }

  const driverError = error.driverError;
  return typeof driverError === 'object' && driverError !== null
    ? (driverError as MysqlDriverError)
    : null;
}

/**
 * 将 MySQL 唯一键冲突转换为安全的客户端字段标识。
 *
 * @param error - 全局异常边界捕获的未知异常。
 * @returns 唯一冲突字段标识；非唯一键异常返回 `null`。
 */
export function getMysqlDuplicateKey(error: unknown): string | null {
  const driverError = getDriverError(error);
  if (!driverError) {
    return null;
  }

  const isDuplicateEntry =
    driverError.code === 'ER_DUP_ENTRY' || driverError.errno === 1062;
  if (!isDuplicateEntry) {
    return null;
  }

  const queryError = error as QueryFailedError;
  const messages = [
    driverError.sqlMessage,
    driverError.message,
    queryError.message,
  ];

  for (const message of messages) {
    if (typeof message !== 'string') {
      continue;
    }

    const indexName = extractIndexName(message);
    if (indexName) {
      return toSafeDuplicateKey(indexName);
    }
  }

  return 'uniqueKey';
}
