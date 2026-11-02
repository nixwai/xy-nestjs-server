import { ApiProperty } from '@nestjs/swagger';
import { PageResponseDto } from '../../../common/dto/index.js';
import { RoleResponseDto } from './role-response.dto.js';

/** 角色分页列表响应数据。 */
export class RoleListResponseDto extends PageResponseDto<RoleResponseDto> {
  @ApiProperty({
    type: () => [RoleResponseDto],
    description: '当前页角色列表。',
  })
  declare items: RoleResponseDto[];
}
