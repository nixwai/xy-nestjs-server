import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min } from 'class-validator';
export class CreateMenuDto {
  @ApiPropertyOptional({ type: String, nullable: true }) @IsOptional() @IsString() parentId?: string | null;
  @ApiProperty({ type: String, maxLength: 128 }) @IsString() @IsNotEmpty() @MaxLength(128) title!: string;
  @ApiProperty({ type: String, maxLength: 255 }) @IsString() @IsNotEmpty() @MaxLength(255) path!: string;
  @ApiPropertyOptional({ type: String }) @IsOptional() @IsString() icon?: string;
  @ApiPropertyOptional({ type: Number, default: 0 }) @IsOptional() @IsInt() @Min(0) order?: number;
  @ApiPropertyOptional({ type: String, nullable: true }) @IsOptional() @IsString() permissionCode?: string | null;
}
export class UpdateMenuDto extends CreateMenuDto {
  @ApiProperty({ type: String }) @IsString() @IsNotEmpty() id!: string;
  @ApiPropertyOptional({ type: Boolean }) @IsOptional() @IsBoolean() isActive?: boolean;
}
export class MenuStatusDto { @ApiProperty({ type: String }) @IsString() @IsNotEmpty() id!: string; }
