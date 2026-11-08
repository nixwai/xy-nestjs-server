import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Length, Matches } from 'class-validator';

/** 批量图片上传请求。 */
export class BatchUploadImagesDto {
  @ApiProperty({ type: 'array', items: { type: 'string', format: 'binary' }, description: '图片文件数组。' })
  files!: string[];

  @ApiPropertyOptional({ type: String, default: 'other', description: '图片分类，只允许字母、数字、下划线和短横线。' })
  @IsOptional()
  @IsString()
  @Length(1, 64)
  @Matches(/^[a-zA-Z0-9_-]+$/, { message: '分类只能包含字母、数字、下划线和短横线' })
  category?: string;
}
