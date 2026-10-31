import { ApiProperty } from '@nestjs/swagger';
import { PermissionResponseDto } from './permission-response.dto.js';

/** 权限列表响应数据。 */
export class PermissionListResponseDto {
  @ApiProperty({
    type: () => [PermissionResponseDto],
    description: '权限列表。',
  })
  items!: PermissionResponseDto[];

  @ApiProperty({ type: Number, description: '权限总数。', example: 1 })
  total!: number;
}
