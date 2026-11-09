import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PageQueryDto } from '#/common/dto/index.js';
export class AssetImageQueryDto extends PageQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsString() folderId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() keyword?: string;
}
export class BatchAssetUploadDto {
  @ApiPropertyOptional({ nullable: true }) @IsOptional() @IsString() folderId?: string | null;
}
export class MoveAssetImageDto {
  @ApiPropertyOptional({ nullable: true }) @IsOptional() @IsString() folderId?: string | null;
}
