import { ApiProperty } from '@nestjs/swagger';

/** 页码分页响应基类。 */
export class PageResponseDto<T> {
  @ApiProperty({ isArray: true, description: '当前页数据。' })
  items!: T[];

  @ApiProperty({ type: Number, description: '符合条件的总条数。' })
  total!: number;

  @ApiProperty({ type: Number, description: '当前页码。' })
  page!: number;

  @ApiProperty({ type: Number, description: '每页条数。' })
  pageSize!: number;

  @ApiProperty({ type: Number, description: '总页数。' })
  totalPages!: number;

  @ApiProperty({ type: Boolean, description: '是否存在下一页。' })
  hasNextPage!: boolean;

  @ApiProperty({ type: Boolean, description: '是否存在上一页。' })
  hasPreviousPage!: boolean;
}
