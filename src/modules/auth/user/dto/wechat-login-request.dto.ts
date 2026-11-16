import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';
import { createValidationMessages } from '#/common/constants/index.js';

const codeValidation = createValidationMessages('微信登录凭证');
const nicknameValidation = createValidationMessages('昵称');
const avatarValidation = createValidationMessages('头像地址');

/** 微信小程序登录请求。 */
export class WechatLoginRequestDto {
  /** uni.login 返回的一次性登录凭证。 */
  @ApiProperty({ type: String, minLength: 1, maxLength: 256, description: 'uni.login 返回的微信登录凭证。' })
  @IsString({ message: codeValidation.isString })
  @IsNotEmpty({ message: codeValidation.isNotEmpty })
  @MaxLength(256, { message: codeValidation.maxLength(256) })
  code!: string;

  /** 用户授权后提供的展示昵称。 */
  @ApiPropertyOptional({ type: String, maxLength: 128, description: '用户授权后提供的展示昵称。' })
  @IsOptional()
  @IsString({ message: nicknameValidation.isString })
  @MaxLength(128, { message: nicknameValidation.maxLength(128) })
  nickname?: string;

  /** 用户授权后提供的头像地址。 */
  @ApiPropertyOptional({ type: String, maxLength: 512, description: '用户授权后提供的头像地址。' })
  @IsOptional()
  @IsString({ message: avatarValidation.isString })
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true }, { message: '头像地址必须是合法的 HTTP(S) URL' })
  @MaxLength(512, { message: avatarValidation.maxLength(512) })
  avatarUrl?: string;
}
