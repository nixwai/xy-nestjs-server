import type { CursorPayload } from '../types/index.js';
import { isRecord } from './type-guard.util.js';

/** 将游标载荷编码为不透明的 Base64URL 字符串。 */
export function encodeCursor(payload: CursorPayload): string {
  return Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
}

/** 解码游标载荷，格式不正确时返回 null。 */
export function decodeCursor(value: string): CursorPayload | null {
  try {
    const parsed: unknown = JSON.parse(Buffer.from(value, 'base64url').toString('utf8'));
    if (!isCursorPayload(parsed)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function isCursorPayload(value: unknown): value is CursorPayload {
  return isRecord(value) && Object.values(value).every(item => typeof item === 'string');
}
