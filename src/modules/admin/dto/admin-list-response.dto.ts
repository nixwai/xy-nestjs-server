import { ApiProperty } from '@nestjs/swagger';
import { PageResponseDto } from '#/common/dto/index.js';
import { AdminResponseDto } from './admin-response.dto.js';

/** 管理员分页列表响应数据。 */
export class AdminListResponseDto extends PageResponseDto<AdminResponseDto> {
  @ApiProperty({
    type: () => [AdminResponseDto],
    description: '当前页管理员列表。'
  })
  declare items: AdminResponseDto[];
}
