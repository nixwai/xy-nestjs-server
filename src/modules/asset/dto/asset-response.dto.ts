import { ApiProperty } from '@nestjs/swagger';

export class AssetFolderResponseDto {
  @ApiProperty({ type: String }) id!: string;
  @ApiProperty({ type: String }) name!: string;
  @ApiProperty({ type: String, nullable: true }) parentId!: string | null;
  @ApiProperty({ type: String }) createdByAdminId!: string;
  @ApiProperty({ type: String }) ownerId!: string;
  @ApiProperty({ type: Number }) imageCount!: number;
  @ApiProperty({ type: Date }) createdAt!: Date;
  @ApiProperty({ type: Date }) updatedAt!: Date;
}
export class AssetImageResponseDto {
  @ApiProperty({ type: String }) id!: string;
  @ApiProperty({ type: String, nullable: true }) folderId!: string | null;
  @ApiProperty({ type: String }) originalName!: string;
  @ApiProperty({ type: String }) url!: string;
  @ApiProperty({ type: String }) storageKey!: string;
  @ApiProperty({ type: String }) mimeType!: string;
  @ApiProperty({ type: Number }) size!: number;
  @ApiProperty({ type: Number, nullable: true }) width!: number | null;
  @ApiProperty({ type: Number, nullable: true }) height!: number | null;
  @ApiProperty({ type: String }) createdByAdminId!: string;
  @ApiProperty({ type: String }) ownerId!: string;
  @ApiProperty({ type: Date }) createdAt!: Date;
  @ApiProperty({ type: Date }) updatedAt!: Date;
}
export class AssetFolderListResponseDto {
  @ApiProperty({ type: [AssetFolderResponseDto] }) items!: AssetFolderResponseDto[];
  @ApiProperty({ type: Number }) total!: number;
}
export class AssetImagePageResponseDto {
  @ApiProperty({ type: [AssetImageResponseDto] }) items!: AssetImageResponseDto[];
  @ApiProperty({ type: Number }) total!: number;
  @ApiProperty({ type: Number }) page!: number;
  @ApiProperty({ type: Number }) pageSize!: number;
  @ApiProperty({ type: Number }) totalPages!: number;
  @ApiProperty({ type: Boolean }) hasNextPage!: boolean;
  @ApiProperty({ type: Boolean }) hasPreviousPage!: boolean;
}
export class AssetUploadFailedResponseDto {
  @ApiProperty({ type: String }) filename!: string;
  @ApiProperty({ type: String }) reason!: string;
}
export class BatchAssetUploadResponseDto {
  @ApiProperty({ type: [AssetImageResponseDto] }) success!: AssetImageResponseDto[];
  @ApiProperty({ type: [AssetUploadFailedResponseDto] }) failed!: AssetUploadFailedResponseDto[];
  @ApiProperty({ type: Number }) totalCount!: number;
  @ApiProperty({ type: Number }) successCount!: number;
}

/** 素材所有者的最小公开信息。 */
export class AssetOwnerResponseDto {
  @ApiProperty({ type: String }) id!: string;
  @ApiProperty({ type: String }) username!: string;
  @ApiProperty({ type: Boolean }) isActive!: boolean;
}
/** 可选素材所有者列表。 */
export class AssetOwnerListResponseDto {
  @ApiProperty({ type: [AssetOwnerResponseDto] }) items!: AssetOwnerResponseDto[];
  @ApiProperty({ type: Number }) total!: number;
}

/** 上传约束来自服务端配置及请求内存预算。 */
export class AssetUploadLimitsResponseDto {
  @ApiProperty({ type: Number }) maxFiles!: number;
  @ApiProperty({ type: Number }) maxFileSize!: number;
  @ApiProperty({ type: Number }) maxBatchSize!: number;
}
