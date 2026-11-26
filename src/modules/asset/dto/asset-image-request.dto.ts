import { ApiProperty } from '@nestjs/swagger';
import { Allow, IsString, Matches } from 'class-validator';
import { PageQueryDto } from '#/common/dto/index.js';

const idPattern = /^[1-9][0-9]*$/;

/** 查询素材图片请求。 */
export class AssetImageListQueryDto extends PageQueryDto {
  /** 目标文件夹主键。 */
  @ApiProperty({ type: String, pattern: idPattern })
  @IsString({ message: '文件夹 ID 必须为字符串' })
  @Matches(idPattern, { message: '文件夹 ID 必须为正整数字符串' })
  folderId!: string;
}

/** 批量上传素材图片请求。 */
export class AssetImageUploadDto {
  /** 目标文件夹主键。 */
  @ApiProperty({ type: String, pattern: idPattern })
  @IsString({ message: '文件夹 ID 必须为字符串' })
  @Matches(idPattern, { message: '文件夹 ID 必须为正整数字符串' })
  folderId!: string;

  /** 图片文件数组。 */
  @ApiProperty({ type: 'array', items: { type: 'string', format: 'binary' }, description: '待上传图片。' })
  @Allow()
  files!: string[];
}
