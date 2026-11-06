import { ApiProperty } from '@nestjs/swagger';
import { AdminResponseDto } from './admin-response.dto.js';
/** 管理员菜单项。 */
export class AdminMenuItemResponseDto {
  /** 唯一标识。 */
  @ApiProperty({ type: String }) id!: string;
  /** 菜单稳定标识。 */
  @ApiProperty({ type: String }) menuKey!: string;
  /** 菜单展示标题。 */
  @ApiProperty({ type: String }) title!: string;
  /** 请求路径。 */
  @ApiProperty({ type: String }) path!: string;
  /** 菜单显示顺序。 */
  @ApiProperty({ type: Number }) order!: number;
  /** 权限编码。 */
  @ApiProperty({ type: String, nullable: true, description: '菜单所需权限编码。' })
  permissionCode!: string | null;
  /** 当前菜单的可见子菜单。 */
  @ApiProperty({ type: () => [AdminMenuItemResponseDto], required: false })
  children?: AdminMenuItemResponseDto[];
}

/** 当前管理员及其授权信息。 */
export class AdminMeResponseDto extends AdminResponseDto {
  /** 当前身份可使用的权限编码列表。 */
  @ApiProperty({ type: [String], description: '当前管理员可用的权限编码。' })
  permissions!: string[];
  /** 当前身份可见的菜单列表。 */
  @ApiProperty({ type: () => [AdminMenuItemResponseDto], description: '当前管理员可见菜单。' })
  menus!: AdminMenuItemResponseDto[];
}
