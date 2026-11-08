import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { createValidationMessages } from '../constants/index.js';

const limitValidation = createValidationMessages('每页条数');
const cursorValidation = createValidationMessages('游标');
/** 游标分页查询参数。 */
export class CursorPageQueryDto {
  /** 单次查询允许返回的最大记录数。 */
  @ApiPropertyOptional({
    type: Number,
    default: 20,
    minimum: 1,
    maximum: 100,
    description: '每页条数，范围 1-100。'
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: limitValidation.isInt })
  @Min(1, { message: limitValidation.min(1) })
  @Max(100, { message: limitValidation.max(100) })
  limit = 20;
  /** 用于定位下一页数据的游标。 */
  @ApiPropertyOptional({
    type: String,
    description: '上一页返回的不透明游标。'
  })
  @IsOptional()
  @IsString({ message: cursorValidation.isString })
  cursor?: string;
}
