import { ApiProperty } from '@nestjs/swagger';
import { RoleResponseDto } from './role-response.dto.js';

/** 角色列表响应数据。 */
export class RoleListResponseDto {
  @ApiProperty({ type: () => [RoleResponseDto], description: '角色列表。' })
  items!: RoleResponseDto[];

  @ApiProperty({
    type: Number,
    description: '符合条件的角色总数。',
    example: 1,
  })
  total!: number;
}
