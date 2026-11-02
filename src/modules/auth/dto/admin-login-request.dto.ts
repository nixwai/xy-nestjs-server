import { ApiProperty } from '@nestjs/swagger';
import { createValidationMessages } from '../../../common/constants/index.js';
import { IsNotEmpty, IsString, Matches, MaxLength, MinLength } from 'class-validator';

const usernameValidation = createValidationMessages('用户名');
const passwordValidation = createValidationMessages('密码');

/** 管理员登录请求。 */
export class AdminLoginRequestDto {
  /** 大小写敏感的管理员用户名。 */
  @ApiProperty({ type: String, minLength: 3, maxLength: 64, example: 'admin' })
  @IsString({ message: usernameValidation.isString })
  @IsNotEmpty({ message: usernameValidation.isNotEmpty })
  @MinLength(3, { message: usernameValidation.minLength(3) })
  @MaxLength(64, { message: usernameValidation.maxLength(64) })
  @Matches(/^[A-Za-z0-9._-]+$/, { message: '用户名格式不正确' })
  username!: string;

  /** 管理员密码。 */
  @ApiProperty({
    type: String,
    minLength: 8,
    maxLength: 72,
    example: 'Admin1234'
  })
  @IsString({ message: passwordValidation.isString })
  @IsNotEmpty({ message: passwordValidation.isNotEmpty })
  @MinLength(8, { message: passwordValidation.minLength(8) })
  @MaxLength(72, { message: passwordValidation.maxLength(72) })
  @Matches(/^(?=.*[A-Za-z])(?=.*\d).+$/, {
    message: '密码必须同时包含字母和数字'
  })
  password!: string;
}
