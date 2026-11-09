import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PageQueryDto } from '#/common/dto/index.js';

export class AssetImageQueryDto extends PageQueryDto {
  @ApiPropertyOptional({ type: String }) @IsOptional() @IsString() folderId?: string;
  @ApiPropertyOptional({ type: String }) @IsOptional() @IsString() keyword?: string;
}
export class BatchAssetUploadDto {
  @ApiPropertyOptional({ type: String, nullable: true }) @IsOptional() @IsString() folderId?: string | null;
}
export class MoveAssetImageDto {
  @ApiPropertyOptional({ type: String, nullable: true }) @IsOptional() @IsString() folderId?: string | null;
}
