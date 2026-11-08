import { ApiProperty } from '@nestjs/swagger';
/** 页码分页响应基类。 */
export class PageResponseDto<T> {
  /** 列表数据。 */
  @ApiProperty({ isArray: true, description: '当前页数据。' })
  items!: T[];
  /** 匹配记录总数。 */
  @ApiProperty({ type: Number, description: '符合条件的总条数。' })
  total!: number;
  /** 当前页码。 */
  @ApiProperty({ type: Number, description: '当前页码。' })
  page!: number;
  /** 每页返回数量。 */
  @ApiProperty({ type: Number, description: '每页条数。' })
  pageSize!: number;
  /** 分页总页数。 */
  @ApiProperty({ type: Number, description: '总页数。' })
  totalPages!: number;
  /** 是否存在下一页。 */
  @ApiProperty({ type: Boolean, description: '是否存在下一页。' })
  hasNextPage!: boolean;
  /** 是否存在上一页。 */
  @ApiProperty({ type: Boolean, description: '是否存在上一页。' })
  hasPreviousPage!: boolean;
}
