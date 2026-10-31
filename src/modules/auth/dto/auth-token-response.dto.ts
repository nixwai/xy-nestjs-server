import { ApiProperty } from '@nestjs/swagger';

/** 管理员公开身份。 */
export class AdminIdentityDto {
  @ApiProperty({ type: String, example: '1', description: '管理员 ID。' })
  id!: string;

  @ApiProperty({
    type: String,
    example: 'admin',
    description: '管理员用户名。',
  })
  username!: string;

  @ApiProperty({ type: Boolean, description: '是否为超级管理员。' })
  isSuperAdmin!: boolean;

  @ApiProperty({
    type: String,
    enum: ['admin'],
    description: '管理员身份类型。',
  })
  role!: 'admin';
}

/** 登录和刷新令牌接口返回数据。 */
export class AuthTokenResponseDto {
  @ApiProperty({
    type: String,
    description: '访问令牌，用于 Authorization 请求头。',
  })
  accessToken!: string;

  @ApiProperty({
    type: String,
    description: '刷新令牌，用于刷新或注销当前会话。',
  })
  refreshToken!: string;

  @ApiProperty({
    type: String,
    example: 'Bearer',
    description: '访问令牌类型。',
  })
  tokenType!: 'Bearer';

  @ApiProperty({
    type: Number,
    example: 900,
    description: '访问令牌有效期，单位为秒。',
  })
  accessTokenExpiresIn!: number;

  @ApiProperty({
    type: Number,
    example: 604800,
    description: '刷新令牌有效期，单位为秒。',
  })
  refreshTokenExpiresIn!: number;

  @ApiProperty({
    type: () => AdminIdentityDto,
    description: '当前登录管理员的公开身份。',
  })
  admin!: AdminIdentityDto;
}
