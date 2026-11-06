/** 页码分页查询结果。 */
export interface PageResult<T> {
  /** 列表数据。 */
  items: T[];
  /** 匹配记录总数。 */
  total: number;
  /** 当前页码。 */
  page: number;
  /** 每页返回数量。 */
  pageSize: number;
  /** 分页总页数。 */
  totalPages: number;
  /** 是否存在下一页。 */
  hasNextPage: boolean;
  /** 是否存在上一页。 */
  hasPreviousPage: boolean;
}

/** 游标分页查询结果。 */
export interface CursorPageResult<T> {
  /** 列表数据。 */
  items: T[];
  /** 下一页定位游标。 */
  nextCursor: string | null;
  /** 是否还有更多数据。 */
  hasMore: boolean;
}
