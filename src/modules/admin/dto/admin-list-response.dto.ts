import { ApiProperty } from '@nestjs/swagger';
import { AdminResponseDto } from './admin-response.dto.js';

/** 管理员列表响应数据。 */
export class AdminListResponseDto {
  @ApiProperty({ type: () => [AdminResponseDto], description: '管理员列表。' })
  items!: AdminResponseDto[];

  @ApiProperty({
    type: Number,
    description: '符合条件的管理员总数。',
    example: 1,
  })
  total!: number;
}
