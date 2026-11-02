import { ApiProperty } from '@nestjs/swagger';
import { MenuResponseDto } from './menu-response.dto.js';

/** 菜单完整列表响应数据。 */
export class MenuListResponseDto {
  @ApiProperty({ type: () => [MenuResponseDto], description: '菜单列表。' })
  items!: MenuResponseDto[];

  @ApiProperty({ type: Number, description: '菜单总数。', example: 1 })
  total!: number;
}
