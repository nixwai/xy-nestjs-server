import { ApiProperty } from '@nestjs/swagger';
/** 角色公开信息。 */
export class RoleResponseDto {
  /** 唯一标识。 */
  @ApiProperty({ type: String, description: '角色 ID。', example: '1' })
  id!: string;
  /** 业务编码。 */
  @ApiProperty({ type: String, description: '角色编码。', example: 'operator' })
  code!: string;
  /** 名称。 */
  @ApiProperty({ type: String, description: '角色名称。', example: '运营人员' })
  name!: string;
  /** 资源描述。 */
  @ApiProperty({
    type: String,
    nullable: true,
    description: '角色描述。未填写时为 null。',
    example: '负责日常运营管理。'
  })
  description!: string | null;
  /** 是否启用。 */
  @ApiProperty({ type: Boolean, description: '是否启用。', example: true })
  isActive!: boolean;
  /** 角色关联的权限标识列表。 */
  @ApiProperty({
    type: [String],
    description: '已绑定的权限 ID 列表。',
    example: ['1', '2']
  })
  permissionIds!: string[];
  /** 记录删除时间。 */
  @ApiProperty({
    type: String,
    format: 'date-time',
    nullable: true,
    description: '软删除时间。未删除时为 null。',
    example: null
  })
  deletedAt!: Date | null;
}
