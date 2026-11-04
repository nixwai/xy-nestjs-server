import { ApiProperty } from '@nestjs/swagger';

/** 管理员公开信息。 */
export class AdminResponseDto {
  @ApiProperty({ type: String, description: '管理员 ID。', example: '1' })
  id!: string;

  @ApiProperty({ type: String, description: '登录用户名。', example: 'admin' })
  username!: string;

  @ApiProperty({ type: Boolean, description: '是否允许登录。', example: true })
  isActive!: boolean;

  @ApiProperty({
    type: Boolean,
    description: '是否拥有系统全部权限。',
    example: true
  })
  isRoot!: boolean;

  @ApiProperty({
    type: [String],
    description: '已绑定的角色 ID 列表。',
    example: ['1', '2']
  })
  roleIds!: string[];

  @ApiProperty({ type: String, format: 'date-time', description: '创建时间。' })
  createdAt!: Date;

  @ApiProperty({
    type: String,
    format: 'date-time',
    description: '最后更新时间。'
  })
  updatedAt!: Date;
}
