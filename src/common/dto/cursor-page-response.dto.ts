import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
/** 游标分页响应基类。 */
export class CursorPageResponseDto<T> {
  /** 列表数据。 */
  @ApiProperty({ isArray: true, description: '当前页数据。' })
  items!: T[];
  /** 下一页定位游标。 */
  @ApiPropertyOptional({
    type: String,
    nullable: true,
    description: '下一页游标，没有下一页时为 null。'
  })
  nextCursor!: string | null;
  /** 是否还有更多数据。 */
  @ApiProperty({ type: Boolean, description: '是否存在下一页。' })
  hasMore!: boolean;
}
