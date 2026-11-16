import { ApiProperty } from '@nestjs/swagger';
import { PageResponseDto } from '#/common/dto/index.js';

/** 后台用户公开信息。 */
export class UserResponseDto {
  /** 用户主键。 */
  @ApiProperty({ type: String, description: '用户 ID。', example: '1' })
  id!: string;
  /** 微信小程序 openId。 */
  @ApiProperty({ type: String, nullable: true, description: '微信小程序 openId，其他登录方式可能为空。' })
  openId!: string | null;
  /** 微信 UnionId。 */
  @ApiProperty({ type: String, nullable: true, description: '微信 UnionId。' })
  unionId!: string | null;
  /** 展示昵称。 */
  @ApiProperty({ type: String, nullable: true, description: '展示昵称。' })
  nickname!: string | null;
  /** 头像地址。 */
  @ApiProperty({ type: String, nullable: true, description: '头像地址。' })
  avatarUrl!: string | null;
  /** 是否允许登录和使用服务。 */
  @ApiProperty({ type: Boolean, description: '是否允许登录和使用服务。' })
  isActive!: boolean;
  /** 最近登录时间。 */
  @ApiProperty({ type: String, format: 'date-time', nullable: true, description: '最近登录时间。' })
  lastLoginAt!: Date | null;
  /** 创建时间。 */
  @ApiProperty({ type: String, format: 'date-time', description: '创建时间。' })
  createdAt!: Date;
  /** 更新时间。 */
  @ApiProperty({ type: String, format: 'date-time', description: '最后更新时间。' })
  updatedAt!: Date;
}

/** 小程序个人页公开信息。 */
export class UserProfileResponseDto {
  /** 用户主键。 */
  @ApiProperty({ type: String, description: '用户 ID。' })
  id!: string;
  /** 展示昵称。 */
  @ApiProperty({ type: String, nullable: true, description: '展示昵称。' })
  nickname!: string | null;
  /** 头像地址。 */
  @ApiProperty({ type: String, nullable: true, description: '头像地址。' })
  avatarUrl!: string | null;
  /** 是否允许登录和使用服务。 */
  @ApiProperty({ type: Boolean, description: '是否允许登录和使用服务。' })
  isActive!: boolean;
  /** 创建时间。 */
  @ApiProperty({ type: String, format: 'date-time', description: '创建时间。' })
  createdAt!: Date;
  /** 更新时间。 */
  @ApiProperty({ type: String, format: 'date-time', description: '最后更新时间。' })
  updatedAt!: Date;
}

/** 后台用户分页列表响应。 */
export class UserListResponseDto extends PageResponseDto<UserResponseDto> {
  /** 当前页用户列表。 */
  @ApiProperty({ type: () => [UserResponseDto], description: '当前页用户列表。' })
  declare items: UserResponseDto[];
}
