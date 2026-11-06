import { ApiProperty } from '@nestjs/swagger';
/** 菜单管理列表项。 */
export class MenuResponseDto {
  /** 唯一标识。 */
  @ApiProperty({ type: String }) id!: string;
  /** 菜单稳定标识。 */
  @ApiProperty({ type: String }) menuKey!: string;
  /** 父级菜单标识。 */
  @ApiProperty({ type: String, nullable: true }) parentKey!: string | null;
  /** 菜单展示标题。 */
  @ApiProperty({ type: String }) title!: string;
  /** 请求路径。 */
  @ApiProperty({ type: String }) path!: string;
  /** 菜单显示顺序。 */
  @ApiProperty({ type: Number }) order!: number;
  /** 权限编码。 */
  @ApiProperty({ type: String, nullable: true }) permissionCode!: string | null;
  /** 是否仅根管理员可见。 */
  @ApiProperty({ type: Boolean }) isRootOnly!: boolean;
  /** 是否启用。 */
  @ApiProperty({ type: Boolean }) isActive!: boolean;
  /** 权限可用性。 */
  @ApiProperty({ type: Boolean }) permissionAvailable!: boolean;
}
