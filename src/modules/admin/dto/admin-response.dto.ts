import { ApiProperty } from '@nestjs/swagger';
/** 管理员公开信息。 */
export class AdminResponseDto {
  /** 唯一标识。 */
  @ApiProperty({ type: String, description: '管理员 ID。', example: '1' })
  id!: string;
  /** 登录用户名。 */
  @ApiProperty({ type: String, description: '登录用户名。', example: 'admin' })
  username!: string;
  /** 是否启用。 */
  @ApiProperty({ type: Boolean, description: '是否允许登录。', example: true })
  isActive!: boolean;
  /** 是否为根管理员。 */
  @ApiProperty({
    type: Boolean,
    description: '是否拥有系统全部权限。',
    example: true
  })
  isRoot!: boolean;
  /** 管理员拥有的角色标识列表。 */
  @ApiProperty({
    type: [String],
    description: '已绑定的角色 ID 列表。',
    example: ['1', '2']
  })
  roleIds!: string[];
  /** 记录创建时间。 */
  @ApiProperty({ type: String, format: 'date-time', description: '创建时间。' })
  createdAt!: Date;
  /** 记录更新时间。 */
  @ApiProperty({
    type: String,
    format: 'date-time',
    description: '最后更新时间。'
  })
  updatedAt!: Date;
}
