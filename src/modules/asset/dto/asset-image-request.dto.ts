import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { Allow, IsBoolean, IsNotEmpty, IsOptional, IsString, Matches, MaxLength } from 'class-validator';
import { PageQueryDto } from '#/common/dto/index.js';

const idPattern = /^[1-9][0-9]*$/;
const keywordMaxLength = 64;
/** 将查询字符串中的布尔取值转换为 boolean，保留未提供时的缺省语义。 */
function toBoolean(value: unknown): unknown {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return value;
}

/** 查询素材图片请求。 */
export class AssetImageListQueryDto extends PageQueryDto {
  /** 目标文件夹主键。 */
  @ApiProperty({ type: String, pattern: idPattern })
  @IsString({ message: '文件夹 ID 必须为字符串' })
  @Matches(idPattern, { message: '文件夹 ID 必须为正整数字符串' })
  folderId!: string;
}

/** 素材图片搜索请求。 */
export class AssetImageSearchQueryDto extends PageQueryDto {
  /** 图片原始文件名关键词。 */
  @ApiProperty({ type: String, maxLength: keywordMaxLength, description: '按图片原始文件名模糊搜索。' })
  @IsString({ message: '关键词必须为字符串' })
  @IsNotEmpty({ message: '请输入搜索关键词' })
  @MaxLength(keywordMaxLength, { message: `关键词长度不能超过${keywordMaxLength}个字符` })
  keyword!: string;

  /** 限定搜索的文件夹主键。 */
  @ApiPropertyOptional({ type: String, pattern: idPattern, description: '限定为该文件夹及其全部子孙文件夹。' })
  @IsOptional()
  @IsString({ message: '文件夹 ID 必须为字符串' })
  @Matches(idPattern, { message: '文件夹 ID 必须为正整数字符串' })
  folderId?: string;

  /** 限定搜索的素材拥有者主键。 */
  @ApiPropertyOptional({ type: String, pattern: idPattern, description: '限定为该账号名下全部文件夹。' })
  @IsOptional()
  @IsString({ message: '账号 ID 必须为字符串' })
  @Matches(idPattern, { message: '账号 ID 必须为正整数字符串' })
  ownerId?: string;

  /** 是否搜索全部账号的素材。 */
  @ApiPropertyOptional({ type: Boolean, description: '未限定范围时是否覆盖全部账号，需要全局素材管理权限。' })
  @IsOptional()
  @Transform(({ value }) => toBoolean(value))
  @IsBoolean({ message: '全部范围标识必须为布尔值' })
  all?: boolean;
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
