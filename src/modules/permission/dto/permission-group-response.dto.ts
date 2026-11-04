import { ApiProperty } from '@nestjs/swagger';
import { PermissionResponseDto } from './permission-response.dto.js';

/** 按分类分组的权限目录。 */
export class PermissionGroupResponseDto {
  @ApiProperty({ type: String, description: '权限分类标识。', example: 'system' })
  category!: string;

  @ApiProperty({ type: String, description: '权限分类展示名称。', example: '系统管理' })
  categoryName!: string;

  @ApiProperty({ type: () => [PermissionResponseDto], description: '该分类下的权限列表。' })
  permissions!: PermissionResponseDto[];
}

/** 权限分组列表响应数据。 */
export class PermissionGroupListResponseDto {
  @ApiProperty({
    type: () => [PermissionGroupResponseDto],
    description: '按分类分组的权限列表。'
  })
  groups!: PermissionGroupResponseDto[];

  @ApiProperty({ type: Number, description: '权限总数。', example: 1 })
  total!: number;
}
