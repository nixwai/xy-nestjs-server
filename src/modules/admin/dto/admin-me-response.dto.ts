import { ApiProperty } from '@nestjs/swagger';
import { AdminResponseDto } from './admin-response.dto.js';

/** 管理员菜单项。 */
export class AdminMenuItemDto {
  @ApiProperty({ type: String }) id!: string;
  @ApiProperty({ type: String }) title!: string;
  @ApiProperty({ type: String }) path!: string;
  @ApiProperty({ type: String, required: false }) icon?: string;
  @ApiProperty({ type: Number }) order!: number;
  @ApiProperty({ type: () => [AdminMenuItemDto], required: false }) children?: AdminMenuItemDto[];
}

/** 当前管理员及其授权信息。 */
export class AdminMeResponseDto extends AdminResponseDto {
  @ApiProperty({ type: [String], description: '当前管理员可用的权限编码。' })
  permissions!: string[];

  @ApiProperty({ type: () => [AdminMenuItemDto], description: '当前管理员可见菜单。' })
  menus!: AdminMenuItemDto[];
}
