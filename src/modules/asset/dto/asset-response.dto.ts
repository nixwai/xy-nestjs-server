import { ApiProperty } from '@nestjs/swagger';
export class AssetFolderResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() name!: string;
  @ApiProperty({ nullable: true }) parentId!: string | null;
  @ApiProperty() createdByAdminId!: string;
  @ApiProperty() imageCount!: number;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;
}
export class AssetImageResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty({ nullable: true }) folderId!: string | null;
  @ApiProperty() originalName!: string;
  @ApiProperty() url!: string;
  @ApiProperty() storageKey!: string;
  @ApiProperty() mimeType!: string;
  @ApiProperty() size!: number;
  @ApiProperty({ nullable: true }) width!: number | null;
  @ApiProperty({ nullable: true }) height!: number | null;
  @ApiProperty() createdByAdminId!: string;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;
}
export class AssetFolderListResponseDto {
  @ApiProperty({ type: [AssetFolderResponseDto] }) items!: AssetFolderResponseDto[];
  @ApiProperty() total!: number;
}
export class AssetImagePageResponseDto {
  @ApiProperty({ type: [AssetImageResponseDto] }) items!: AssetImageResponseDto[];
  @ApiProperty() total!: number;
  @ApiProperty() page!: number;
  @ApiProperty() pageSize!: number;
  @ApiProperty() totalPages!: number;
  @ApiProperty() hasNextPage!: boolean;
  @ApiProperty() hasPreviousPage!: boolean;
}
export class AssetUploadFailedResponseDto {
  @ApiProperty() filename!: string;
  @ApiProperty() reason!: string;
}
export class BatchAssetUploadResponseDto {
  @ApiProperty({ type: [AssetImageResponseDto] }) success!: AssetImageResponseDto[];
  @ApiProperty({ type: [AssetUploadFailedResponseDto] }) failed!: AssetUploadFailedResponseDto[];
  @ApiProperty() totalCount!: number;
  @ApiProperty() successCount!: number;
}
