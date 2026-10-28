import { ApiProperty } from '@nestjs/swagger';

/** 管理员公开身份。 */
export class AdminIdentityDto {
  @ApiProperty({ type: String, example: '1' }) id!: string;
  @ApiProperty({ type: String, example: 'admin' }) username!: string;
  @ApiProperty({ type: Boolean }) isSuperAdmin!: boolean;
  @ApiProperty({ type: String, enum: ['admin'] }) role!: 'admin';
}
/** 令牌接口返回数据。 */
export class AuthTokenResponseDto {
  @ApiProperty({ type: String }) accessToken!: string;
  @ApiProperty({ type: String }) refreshToken!: string;
  @ApiProperty({ type: String, example: 'Bearer' }) tokenType!: 'Bearer';
  @ApiProperty({ type: Number, example: 900 }) accessTokenExpiresIn!: number;
  @ApiProperty({ type: Number, example: 604800 })
  refreshTokenExpiresIn!: number;
  @ApiProperty({ type: () => AdminIdentityDto }) admin!: AdminIdentityDto;
}
