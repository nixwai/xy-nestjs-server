import { ApiProperty } from '@nestjs/swagger';

/** 用户登录或刷新接口返回的用户令牌。 */
export class UserAuthTokenResponseDto {
  /** 访问令牌。 */
  @ApiProperty({ type: String, description: 'Bearer 访问令牌。' })
  accessToken!: string;
  /** 刷新令牌。 */
  @ApiProperty({ type: String, description: '用于轮换访问令牌的刷新令牌。' })
  refreshToken!: string;
  /** 令牌类型。 */
  @ApiProperty({ type: String, example: 'Bearer' })
  tokenType!: 'Bearer';
  /** 访问令牌有效期，单位为秒。 */
  @ApiProperty({ type: Number, description: '访问令牌有效期，单位为秒。' })
  accessTokenExpiresIn!: number;
  /** 刷新令牌有效期，单位为秒。 */
  @ApiProperty({ type: Number, description: '刷新令牌有效期，单位为秒。' })
  refreshTokenExpiresIn!: number;
  /** 登录用户身份。 */
  @ApiProperty({
    type: Object,
    description: '登录用户公开身份。',
    example: { id: '1', nickname: '微信用户', avatarUrl: null, role: 'user' }
  })
  user!: {
    id: string;
    nickname: string | null;
    avatarUrl: string | null;
    role: 'user';
  };
}
