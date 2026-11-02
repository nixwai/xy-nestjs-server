import { ApiProperty } from '@nestjs/swagger';

/** 角色公开信息。 */
export class RoleResponseDto {
  @ApiProperty({ type: String, description: '角色 ID。', example: '1' })
  id!: string;

  @ApiProperty({ type: String, description: '角色编码。', example: 'operator' })
  code!: string;

  @ApiProperty({ type: String, description: '角色名称。', example: '运营人员' })
  name!: string;

  @ApiProperty({
    type: String,
    nullable: true,
    description: '角色描述。未填写时为 null。',
    example: '负责日常运营管理。'
  })
  description!: string | null;

  @ApiProperty({ type: Boolean, description: '是否启用。', example: true })
  isActive!: boolean;

  @ApiProperty({
    type: [String],
    description: '已绑定的权限 ID 列表。',
    example: ['1', '2']
  })
  permissionIds!: string[];

  @ApiProperty({
    type: String,
    format: 'date-time',
    nullable: true,
    description: '软删除时间。未删除时为 null。',
    example: null
  })
  deletedAt!: Date | null;
}
