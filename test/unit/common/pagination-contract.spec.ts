import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { describe, expect, it } from 'vitest';
import { CursorPageQueryDto, PageQueryDto } from '#/common/dto/index.js';
import { decodeCursor, encodeCursor } from '#/common/utils/index.js';
import { createPageResult } from '#/common/utils/pagination.util.js';

describe('分页和游标契约', () => {
  it('默认分页从第一页开始，非法页码和页大小被拒绝', async () => {
    const defaults = plainToInstance(PageQueryDto, {});
    expect(defaults).toMatchObject({ page: 1, pageSize: 20, skip: 0 });
    expect(await validate(plainToInstance(PageQueryDto, { page: 0, pageSize: 101 }))).toHaveLength(2);
  });

  it('正确计算空结果、首尾页和边界标记', () => {
    const first = plainToInstance(PageQueryDto, { page: 1, pageSize: 2 });
    expect(createPageResult([], 0, first)).toMatchObject({ totalPages: 0, hasNextPage: false, hasPreviousPage: false });
    expect(createPageResult(['a'], 3, first)).toMatchObject({
      totalPages: 2,
      hasNextPage: true,
      hasPreviousPage: false
    });
    const beyond = plainToInstance(PageQueryDto, { page: 3, pageSize: 2 });
    expect(createPageResult([], 3, beyond)).toMatchObject({ totalPages: 2, hasNextPage: false, hasPreviousPage: true });
  });

  it('游标可往返编码，非法结构和过大 limit 被拒绝', async () => {
    const cursor = encodeCursor({ createdAt: '2026-01-01T00:00:00.000Z', id: '1' });
    expect(decodeCursor(cursor)).toEqual({ createdAt: '2026-01-01T00:00:00.000Z', id: '1' });
    expect(decodeCursor('invalid')).toBeNull();
    expect(decodeCursor(Buffer.from(JSON.stringify({ id: 1 })).toString('base64url'))).toBeNull();
    expect(await validate(plainToInstance(CursorPageQueryDto, { limit: 101 }))).toHaveLength(1);
  });
});
