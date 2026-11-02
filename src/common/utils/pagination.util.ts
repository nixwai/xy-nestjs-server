import type { PageQueryDto } from '../dto/page-query.dto.js';
import type { PageResult } from '../types/pagination.types.js';

/** 根据查询参数和总数构造统一分页结果。 */
export function createPageResult<T>(
  items: T[],
  total: number,
  query: PageQueryDto,
): PageResult<T> {
  const totalPages = total === 0 ? 0 : Math.ceil(total / query.pageSize);
  return {
    items: [...items],
    total,
    page: query.page,
    pageSize: query.pageSize,
    totalPages,
    hasNextPage: query.page < totalPages,
    hasPreviousPage: query.page > 1 && total > 0,
  };
}
