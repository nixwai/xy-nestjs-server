import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { createValidationMessages } from '#/common/constants/index.js';

const nicknameValidation = createValidationMessages('昵称');

/** 开发环境免微信登录请求。 */
export class DevelopmentLoginRequestDto {
  /** 开发测试用户昵称。 */
  @ApiPropertyOptional({ type: String, maxLength: 128, description: '开发测试用户昵称。' })
  @IsOptional()
  @IsString({ message: nicknameValidation.isString })
  @MaxLength(128, { message: nicknameValidation.maxLength(128) })
  nickname?: string;
}
