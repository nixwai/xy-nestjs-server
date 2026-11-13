import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, Length, Matches } from 'class-validator';

/** 管理员与文件夹主键均为自增大整数，转成字符串后仍保持该格式。 */
const idPattern = /^[1-9][0-9]*$/;

/** 创建素材文件夹请求。 */
export class CreateAssetFolderDto {
  /** 文件夹名称。 */
  @ApiProperty({ type: String, minLength: 1, maxLength: 128 })
  @IsString({ message: '文件夹名称必须为字符串' })
  @IsNotEmpty({ message: '文件夹名称不能为空' })
  @Length(1, 128, { message: '文件夹名称长度必须为 1 到 128 个字符' })
  name!: string;

  /** 目标拥有者管理员 ID，省略表示归属当前操作者。 */
  @ApiPropertyOptional({ type: String, pattern: idPattern })
  @IsOptional()
  @IsString({ message: '拥有者 ID 必须为字符串' })
  @Matches(idPattern, { message: '拥有者 ID 必须为正整数字符串' })
  ownerId?: string;

  /** 父文件夹 ID，省略或为空表示创建顶层文件夹。 */
  @ApiPropertyOptional({ type: String, nullable: true, pattern: idPattern })
  @IsOptional()
  @IsString({ message: '父文件夹 ID 必须为字符串' })
  @Matches(idPattern, { message: '父文件夹 ID 必须为正整数字符串' })
  parentId?: string | null;
}

/** 重命名素材文件夹请求。 */
export class UpdateAssetFolderDto {
  /** 目标文件夹 ID。 */
  @ApiProperty({ type: String, pattern: idPattern })
  @IsString({ message: '文件夹 ID 必须为字符串' })
  @Matches(idPattern, { message: '文件夹 ID 必须为正整数字符串' })
  id!: string;

  /** 新的文件夹名称。 */
  @ApiProperty({ type: String, minLength: 1, maxLength: 128 })
  @IsString({ message: '文件夹名称必须为字符串' })
  @IsNotEmpty({ message: '文件夹名称不能为空' })
  @Length(1, 128, { message: '文件夹名称长度必须为 1 到 128 个字符' })
  name!: string;
}

/** 软删除素材文件夹请求。 */
export class SoftDeleteAssetFolderDto {
  /** 目标文件夹 ID。 */
  @ApiProperty({ type: String, pattern: idPattern })
  @IsString({ message: '文件夹 ID 必须为字符串' })
  @Matches(idPattern, { message: '文件夹 ID 必须为正整数字符串' })
  id!: string;
}
