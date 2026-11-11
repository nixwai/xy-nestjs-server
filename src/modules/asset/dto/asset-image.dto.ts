import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsString, MaxLength, Matches, ValidateBy, ValidateIf } from 'class-validator';
import { PageQueryDto } from '#/common/dto/index.js';
import { AssetOwnerQueryDto } from './asset-folder.dto.js';

/** 图片分页及归属筛选，未分类不能与文件夹同时使用。 */
export class AssetImageQueryDto extends PageQueryDto {
  @ApiPropertyOptional({ type: String })
  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsString()
  @Matches(/^[1-9][0-9]*$/, { message: 'folderId 必须为正整数字符串' })
  folderId?: string;

  @ApiPropertyOptional({ type: String, maxLength: 128 })
  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsString()
  @MaxLength(128)
  keyword?: string;

  @ApiPropertyOptional({ type: String })
  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsString()
  @Matches(/^[1-9][0-9]*$/, { message: 'ownerId 必须为正整数字符串' })
  ownerId?: string;

  @ApiPropertyOptional({ type: Boolean })
  @Transform(({ value }: { value: unknown }) => (value === 'true' ? true : value === 'false' ? false : value))
  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsBoolean({ message: 'unclassified 必须为 true 或 false' })
  @ValidateBy({
    name: 'unclassifiedWithoutFolder',
    validator: {
      validate: (value: unknown, args) =>
        value !== true || (args !== undefined && (args.object as AssetImageQueryDto).folderId === undefined),
      defaultMessage: () => 'unclassified=true 不能同时指定 folderId'
    }
  })
  unclassified?: boolean;
}

/** 移动图片到文件夹，null 或省略表示未分类。 */
export class MoveAssetImageDto extends AssetOwnerQueryDto {
  @ApiPropertyOptional({ type: String, nullable: true })
  @ValidateIf((_object, value: unknown) => value !== undefined && value !== null)
  @IsString()
  @Matches(/^[1-9][0-9]*$/, { message: 'folderId 必须为正整数字符串' })
  folderId?: string | null;
}

/** multipart 文本字段；files 仅用于文档，不接受客户端 JSON 字段。 */
export class BatchAssetUploadDto extends MoveAssetImageDto {
  @ApiProperty({ type: 'array', items: { type: 'string', format: 'binary' } })
  declare files?: never;
}
