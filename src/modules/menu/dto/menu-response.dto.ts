import { ApiProperty } from '@nestjs/swagger';

/** 菜单管理列表项。 */
export class MenuResponseDto {
  @ApiProperty({ type: String }) id!: string;
  @ApiProperty({ type: String }) menuKey!: string;
  @ApiProperty({ type: String, nullable: true }) parentKey!: string | null;
  @ApiProperty({ type: String }) title!: string;
  @ApiProperty({ type: String }) path!: string;
  @ApiProperty({ type: Number }) order!: number;
  @ApiProperty({ type: String, nullable: true }) permissionCode!: string | null;
  @ApiProperty({ type: Boolean }) isRootOnly!: boolean;
  @ApiProperty({ type: Boolean }) isActive!: boolean;
  @ApiProperty({ type: Boolean }) permissionAvailable!: boolean;
}
