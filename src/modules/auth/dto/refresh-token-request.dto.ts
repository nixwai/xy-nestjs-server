import { ApiProperty } from '@nestjs/swagger';
import { createValidationMessages } from '../../../common/constants/index.js';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

const refreshTokenValidation = createValidationMessages('刷新令牌');

/** Refresh Token 请求。 */
export class RefreshTokenRequestDto {
  /** 当前会话的 Refresh Token。 */
  @ApiProperty({
    type: String,
    minLength: 32,
    maxLength: 256,
    description: '登录或刷新接口返回的 refreshToken。',
  })
  @IsString({ message: refreshTokenValidation.isString })
  @IsNotEmpty({ message: refreshTokenValidation.isNotEmpty })
  @MinLength(32, { message: refreshTokenValidation.minLength(32) })
  @MaxLength(256, { message: refreshTokenValidation.maxLength(256) })
  refreshToken!: string;
}
