import { ApiProperty } from '@nestjs/swagger';
import { MenuResponseDto } from './menu-response.dto.js';
/** 菜单管理列表响应数据。 */
export class MenuListResponseDto {
  /** 列表数据。 */
  @ApiProperty({ type: () => [MenuResponseDto], description: '菜单列表。' })
  items!: MenuResponseDto[];
  /** 匹配记录总数。 */
  @ApiProperty({ type: Number, description: '菜单总数。', example: 1 })
  total!: number;
}
