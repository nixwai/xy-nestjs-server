import { ApiProperty } from '@nestjs/swagger';
/** 管理员公开身份。 */
export class AdminIdentityResponseDto {
  /** 唯一标识。 */
  @ApiProperty({ type: String, example: '1', description: '管理员 ID。' })
  id!: string;
  /** 登录用户名。 */
  @ApiProperty({
    type: String,
    example: 'admin',
    description: '管理员用户名。'
  })
  username!: string;
  /** 是否为根管理员。 */
  @ApiProperty({ type: Boolean, description: '是否为根管理员。' })
  isRoot!: boolean;
  /** 管理员当前角色信息。 */
  @ApiProperty({
    type: String,
    enum: ['admin'],
    description: '管理员身份类型。'
  })
  role!: 'admin';
}

/** 登录和刷新令牌接口返回数据。 */
export class AuthTokenResponseDto {
  /** 访问令牌。 */
  @ApiProperty({
    type: String,
    description: '访问令牌，用于 Authorization 请求头。'
  })
  accessToken!: string;
  /** 刷新令牌。 */
  @ApiProperty({
    type: String,
    description: '刷新令牌，用于刷新或注销当前会话。'
  })
  refreshToken!: string;
  /** 令牌类型。 */
  @ApiProperty({
    type: String,
    example: 'Bearer',
    description: '访问令牌类型。'
  })
  tokenType!: 'Bearer';
  /** 访问令牌有效期。 */
  @ApiProperty({
    type: Number,
    example: 900,
    description: '访问令牌有效期，单位为秒。'
  })
  accessTokenExpiresIn!: number;
  /** 刷新令牌有效期。 */
  @ApiProperty({
    type: Number,
    example: 604800,
    description: '刷新令牌有效期，单位为秒。'
  })
  refreshTokenExpiresIn!: number;
  /** 当前管理员信息。 */
  @ApiProperty({
    type: () => AdminIdentityResponseDto,
    description: '当前登录管理员的公开身份。'
  })
  admin!: AdminIdentityResponseDto;
}
