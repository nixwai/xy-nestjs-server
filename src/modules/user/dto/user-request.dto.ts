import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsNotEmpty, IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';
import { PageQueryDto } from '#/common/dto/index.js';
import { createValidationMessages } from '#/common/constants/index.js';

const idValidation = createValidationMessages('用户 ID');
const codeValidation = createValidationMessages('微信登录凭证');
const nicknameValidation = createValidationMessages('昵称');
const avatarValidation = createValidationMessages('头像地址');
const isActiveValidation = createValidationMessages('启用状态');

/** 后台用户列表分页查询参数。 */
export class UserListQueryDto extends PageQueryDto {
  /** 按用户 ID 搜索。 */
  @ApiPropertyOptional({ type: String, maxLength: 64, description: '按用户 ID 搜索。' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  id?: string;

  /** 按微信 openId 搜索。 */
  @ApiPropertyOptional({ type: String, maxLength: 128, description: '按微信 openId 搜索。' })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  openId?: string;

  /** 按微信 unionId 搜索。 */
  @ApiPropertyOptional({ type: String, maxLength: 128, description: '按微信 unionId 搜索。' })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  unionId?: string;

  /** 按用户昵称搜索。 */
  @ApiPropertyOptional({ type: String, maxLength: 128, description: '按用户昵称搜索。' })
  @IsOptional()
  @IsString({ message: nicknameValidation.isString })
  @MaxLength(128, { message: nicknameValidation.maxLength(128) })
  nickname?: string;

  /** 按启用状态筛选。 */
  @ApiPropertyOptional({ type: Boolean, description: '是否只返回启用或停用用户。' })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean({ message: isActiveValidation.isBoolean })
  isActive?: boolean;
}

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

/** 后台用户资料或状态更新请求。 */
export class UserUpdateRequestDto {
  /** 用户 ID。 */
  @ApiProperty({ type: String, example: '1', description: '待更新用户 ID。' })
  @IsString({ message: idValidation.isString })
  @IsNotEmpty({ message: idValidation.isNotEmpty })
  id!: string;

  /** 展示昵称。 */
  @ApiPropertyOptional({ type: String, maxLength: 128, nullable: true, description: '展示昵称，传 null 可清空。' })
  @IsOptional()
  @IsString({ message: nicknameValidation.isString })
  @MaxLength(128, { message: nicknameValidation.maxLength(128) })
  nickname?: string | null;

  /** 头像地址。 */
  @ApiPropertyOptional({ type: String, maxLength: 512, nullable: true, description: '头像地址，传 null 可清空。' })
  @IsOptional()
  @IsString({ message: avatarValidation.isString })
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true }, { message: '头像地址必须是合法的 HTTP(S) URL' })
  @MaxLength(512, { message: avatarValidation.maxLength(512) })
  avatarUrl?: string | null;

  /** 是否允许登录。 */
  @ApiPropertyOptional({ type: Boolean, description: '是否允许登录和使用服务。' })
  @IsOptional()
  @IsBoolean({ message: isActiveValidation.isBoolean })
  isActive?: boolean;
}
