import { ApiProperty } from '@nestjs/swagger';
import { createValidationMessages } from '#/common/constants/index.js';
import { IsBase64, IsNotEmpty, IsString, Matches, MaxLength, MinLength } from 'class-validator';

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

  /** Base64 编码的 RSA-OAEP-SHA256 管理员密码密文。 */
  @ApiProperty({
    type: String,
    maxLength: 512,
    example: 'Base64-RSA-OAEP-SHA256-ciphertext'
  })
  @IsString({ message: passwordValidation.isString })
  @IsNotEmpty({ message: passwordValidation.isNotEmpty })
  @MaxLength(512, { message: passwordValidation.maxLength(512) })
  @IsBase64({}, { message: '密码密文必须是 Base64 字符串' })
  password!: string;
}
