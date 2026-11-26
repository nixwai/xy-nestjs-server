import { ApiProperty } from '@nestjs/swagger';
import { PageResponseDto } from '#/common/dto/index.js';

/** 素材图片公开信息。 */
export class AssetImageResponseDto {
  /** 素材图片主键。 */
  @ApiProperty({ type: String }) id!: string;
  /** 直属文件夹主键。 */
  @ApiProperty({ type: String }) folderId!: string;
  /** 文件夹拥有者管理员主键。 */
  @ApiProperty({ type: String }) ownerId!: string;
  /** 上传者管理员主键。 */
  @ApiProperty({ type: String }) creatorId!: string;
  /** 用户上传时使用的原始文件名。 */
  @ApiProperty({ type: String }) originalName!: string;
  /** 根据当前环境资源域名动态生成的图片地址。 */
  @ApiProperty({ type: String, format: 'uri' }) url!: string;
  /** 处理后图片的 MIME 类型。 */
  @ApiProperty({ type: String }) mimeType!: string;
  /** 处理后图片的字节数。 */
  @ApiProperty({ type: Number }) size!: number;
  /** 处理后图片宽度。 */
  @ApiProperty({ type: Number }) width!: number;
  /** 处理后图片高度。 */
  @ApiProperty({ type: Number }) height!: number;
  /** 创建时间。 */
  @ApiProperty({ type: String, format: 'date-time' }) createdAt!: Date;
  /** 更新时间。 */
  @ApiProperty({ type: String, format: 'date-time' }) updatedAt!: Date;
}

/** 素材图片分页响应。 */
export class AssetImagePageResponseDto extends PageResponseDto<AssetImageResponseDto> {
  /** 当前页素材图片。 */
  @ApiProperty({ type: () => [AssetImageResponseDto] })
  declare items: AssetImageResponseDto[];
}

/** 批量素材图片上传失败项。 */
export class AssetImageUploadFailedResponseDto {
  /** 原始文件名。 */
  @ApiProperty({ type: String }) filename!: string;
  /** 失败原因。 */
  @ApiProperty({ type: String }) reason!: string;
}

/** 批量素材图片上传响应。 */
export class AssetImageUploadResultDto {
  /** 成功保存的素材图片。 */
  @ApiProperty({ type: () => [AssetImageResponseDto] }) success!: AssetImageResponseDto[];
  /** 上传失败项。 */
  @ApiProperty({ type: () => [AssetImageUploadFailedResponseDto] }) failed!: AssetImageUploadFailedResponseDto[];
  /** 本批次文件总数。 */
  @ApiProperty({ type: Number }) totalCount!: number;
  /** 成功数量。 */
  @ApiProperty({ type: Number }) successCount!: number;
}
