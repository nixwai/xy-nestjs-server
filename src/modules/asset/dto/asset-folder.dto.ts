import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, Length, Matches, ValidateIf } from 'class-validator';

/** 素材资源的可选归属筛选。 */
export class AssetOwnerQueryDto {
  @ApiPropertyOptional({ type: String, pattern: '^[1-9][0-9]*$' })
  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsString()
  @Matches(/^[1-9][0-9]*$/, { message: 'ownerId 必须为正整数字符串' })
  ownerId?: string;
}

/** 素材路径及请求体共用的正整数资源 ID。 */
export class AssetIdParamDto {
  @ApiProperty({ type: String, pattern: '^[1-9][0-9]*$' })
  @IsString()
  @Matches(/^[1-9][0-9]*$/, { message: 'id 必须为正整数字符串' })
  id!: string;
}

/** 创建素材文件夹。 */
export class CreateAssetFolderDto extends AssetOwnerQueryDto {
  @ApiProperty({ type: String, minLength: 1, maxLength: 128 })
  @IsString()
  @Length(1, 128)
  @Matches(/\S/, { message: '文件夹名称不能为空白' })
  name!: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  @ValidateIf((_object, value: unknown) => value !== undefined && value !== null)
  @IsString()
  @Matches(/^[1-9][0-9]*$/, { message: 'parentId 必须为正整数字符串' })
  parentId?: string | null;
}

/** 更新素材文件夹。 */
export class UpdateAssetFolderDto extends AssetIdParamDto {
  @ApiPropertyOptional({ type: String, pattern: '^[1-9][0-9]*$' })
  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsString()
  @Matches(/^[1-9][0-9]*$/, { message: 'ownerId 必须为正整数字符串' })
  ownerId?: string;

  @ApiProperty({ type: String, minLength: 1, maxLength: 128 })
  @IsString()
  @Length(1, 128)
  @Matches(/\S/, { message: '文件夹名称不能为空白' })
  name!: string;
}

/** 删除素材文件夹。 */
export class DeleteAssetFolderDto extends AssetIdParamDto {
  @ApiPropertyOptional({ type: String, pattern: '^[1-9][0-9]*$' })
  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsString()
  @Matches(/^[1-9][0-9]*$/, { message: 'ownerId 必须为正整数字符串' })
  ownerId?: string;
}
