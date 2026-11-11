import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, Length, Matches, ValidateIf } from 'class-validator';

/** 素材资源的可选归属筛选，仅接受正整数字符串。 */
export class AssetOwnerQueryDto {
  @ApiPropertyOptional({ type: String, pattern: '^[1-9][0-9]*$' })
  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsString()
  @Matches(/^[1-9][0-9]*$/, { message: 'ownerId 必须为正整数字符串' })
  ownerId?: string;
}

/** 素材路径参数。 */
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

/** 重命名素材文件夹，不修改归属。 */
export class UpdateAssetFolderDto extends AssetOwnerQueryDto {
  @ApiProperty({ type: String, minLength: 1, maxLength: 128 })
  @IsString()
  @Length(1, 128)
  @Matches(/\S/, { message: '文件夹名称不能为空白' })
  name!: string;
}
