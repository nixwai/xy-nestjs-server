import { ApiProperty } from '@nestjs/swagger';

/** 单张图片上传的公开结果，不暴露对象存储内部 Key。 */
export class UploadImageResponseDto {
  @ApiProperty({ type: String, description: '当前环境下可访问的图片 URL。' }) url!: string;
  @ApiProperty({ type: String, description: '图片分类。' }) category!: string;
  @ApiProperty({ type: String, description: '实际存储图片的 MIME 类型。' }) mimeType!: string;
  @ApiProperty({ type: Number, description: '实际存储图片的字节数。' }) size!: number;
  @ApiProperty({ type: Number, description: '处理后图片宽度。' }) width!: number;
  @ApiProperty({ type: Number, description: '处理后图片高度。' }) height!: number;
}

/** 批量上传失败项。 */
export class UploadFailedItemResponseDto {
  @ApiProperty({ type: String, description: '原始文件名。' }) filename!: string;
  @ApiProperty({ type: String, description: '失败原因。' }) reason!: string;
}

/** 批量图片上传结果。 */
export class BatchUploadResultDto {
  @ApiProperty({ type: [UploadImageResponseDto] }) success!: UploadImageResponseDto[];
  @ApiProperty({ type: [UploadFailedItemResponseDto] }) failed!: UploadFailedItemResponseDto[];
  @ApiProperty({ type: Number, description: '总文件数。' }) totalCount!: number;
  @ApiProperty({ type: Number, description: '成功数量。' }) successCount!: number;
}
