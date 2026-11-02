import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { describe, expect, it } from 'vitest';
import { CursorPageQueryDto, PageQueryDto } from '../../../../src/common/dto/index.js';
import { decodeCursor, encodeCursor } from '../../../../src/common/utils/index.js';
import { createPageResult } from '../../../../src/common/utils/pagination.util.js';

describe('pagination utilities', () => {
  it('应使用默认分页参数并计算 skip', () => {
    const query = plainToInstance(PageQueryDto, {});
    expect(query.page).toBe(1);
    expect(query.pageSize).toBe(20);
    expect(query.skip).toBe(0);
  });

  it('应拒绝超出范围的页码参数', async () => {
    const query = plainToInstance(PageQueryDto, { page: 0, pageSize: 101 });
    const errors = await validate(query);
    expect(errors).toHaveLength(2);
  });

  it('空结果和第一页应正确计算边界元数据', () => {
    const query = plainToInstance(PageQueryDto, { page: 1, pageSize: 20 });
    expect(createPageResult([], 0, query)).toEqual({
      items: [],
      total: 0,
      page: 1,
      pageSize: 20,
      totalPages: 0,
      hasNextPage: false,
      hasPreviousPage: false
    });
  });

  it('第一页和超出范围页应正确计算前后页标记', () => {
    const first = plainToInstance(PageQueryDto, { page: 1, pageSize: 2 });
    expect(createPageResult(['a'], 3, first)).toMatchObject({
      totalPages: 2,
      hasNextPage: true,
      hasPreviousPage: false
    });
    const beyond = plainToInstance(PageQueryDto, { page: 3, pageSize: 2 });
    expect(createPageResult([], 3, beyond)).toMatchObject({
      totalPages: 2,
      hasNextPage: false,
      hasPreviousPage: true
    });
  });

  it('应构造完整的分页元数据', () => {
    const query = plainToInstance(PageQueryDto, { page: 2, pageSize: 2 });
    expect(createPageResult(['a', 'b'], 5, query)).toEqual({
      items: ['a', 'b'],
      total: 5,
      page: 2,
      pageSize: 2,
      totalPages: 3,
      hasNextPage: true,
      hasPreviousPage: true
    });
  });

  it('应编码并校验游标', async () => {
    const cursor = encodeCursor({
      createdAt: '2026-01-01T00:00:00.000Z',
      id: '1'
    });
    expect(decodeCursor(cursor)).toEqual({
      createdAt: '2026-01-01T00:00:00.000Z',
      id: '1'
    });
    expect(decodeCursor('invalid')).toBeNull();
    expect(decodeCursor(Buffer.from(JSON.stringify({ id: 1 })).toString('base64url'))).toBeNull();

    const query = plainToInstance(CursorPageQueryDto, { limit: 101 });
    expect(await validate(query)).toHaveLength(1);
  });
});
