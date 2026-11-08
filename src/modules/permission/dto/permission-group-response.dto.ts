import { ApiProperty } from '@nestjs/swagger';
import { PermissionResponseDto } from './permission-response.dto.js';
/** 按分类分组的权限目录。 */
export class PermissionGroupResponseDto {
  /** 业务分类。 */
  @ApiProperty({ type: String, description: '权限分类标识。', example: 'system' })
  category!: string;
  /** 权限分类名称。 */
  @ApiProperty({ type: String, description: '权限分类展示名称。', example: '系统管理' })
  categoryName!: string;
  /** 当前身份可使用的权限编码列表。 */
  @ApiProperty({ type: () => [PermissionResponseDto], description: '该分类下的权限列表。' })
  permissions!: PermissionResponseDto[];
}

/** 权限分组列表响应数据。 */
export class PermissionGroupListResponseDto {
  /** 按分类聚合的权限列表。 */
  @ApiProperty({
    type: () => [PermissionGroupResponseDto],
    description: '按分类分组的权限列表。'
  })
  groups!: PermissionGroupResponseDto[];
  /** 匹配记录总数。 */
  @ApiProperty({ type: Number, description: '权限总数。', example: 1 })
  total!: number;
}
