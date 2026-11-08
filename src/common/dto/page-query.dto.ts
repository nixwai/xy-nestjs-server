import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { createValidationMessages } from '../constants/index.js';

const pageValidation = createValidationMessages('页码');
const pageSizeValidation = createValidationMessages('每页条数');
/** 页码分页查询参数。 */
export class PageQueryDto {
  /** 当前页码。 */
  @ApiPropertyOptional({
    type: Number,
    default: 1,
    minimum: 1,
    description: '页码，从 1 开始。'
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: pageValidation.isInt })
  @Min(1, { message: pageValidation.min(1) })
  page = 1;
  /** 每页返回数量。 */
  @ApiPropertyOptional({
    type: Number,
    default: 20,
    minimum: 1,
    maximum: 100,
    description: '每页条数，范围 1-100。'
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: pageSizeValidation.isInt })
  @Min(1, { message: pageSizeValidation.min(1) })
  @Max(100, { message: pageSizeValidation.max(100) })
  pageSize = 20;
  /** 当前页之前需要跳过的记录数。 */
  get skip(): number {
    return (this.page - 1) * this.pageSize;
  }
}
