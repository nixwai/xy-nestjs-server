import { createValidationMessages } from '#/common/constants/index.js';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PageQueryDto } from '#/common/dto/index.js';
import { IsBase64, IsBoolean, IsNotEmpty, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

const usernameValidation = createValidationMessages('用户名');
const passwordValidation = createValidationMessages('密码');
const currentPasswordValidation = createValidationMessages('当前密码');
const idValidation = createValidationMessages('ID');
const adminIdValidation = createValidationMessages('管理员 ID');
const roleIdValidation = createValidationMessages('角色 ID');
const isActiveValidation = createValidationMessages('启用状态');
const isSuperAdminValidation = createValidationMessages('超级管理员标识');

/** 管理员列表分页查询参数。 */
export class AdminListQueryDto extends PageQueryDto {}

/** 创建管理员请求。 */
export class AdminCreateRequestDto {
  @ApiProperty({
    type: String,
    minLength: 3,
    maxLength: 64,
    example: 'operator01',
    description: '管理员登录用户名，只允许字母、数字、点、下划线和连字符。'
  })
  @IsString({ message: usernameValidation.isString })
  @IsNotEmpty({ message: usernameValidation.isNotEmpty })
  @MinLength(3, { message: usernameValidation.minLength(3) })
  @MaxLength(64, { message: usernameValidation.maxLength(64) })
  @Matches(/^[A-Za-z0-9._-]+$/, { message: '用户名格式不正确' })
  username!: string;

  @ApiProperty({
    type: String,
    maxLength: 512,
    example: 'Base64-RSA-OAEP-SHA256-ciphertext',
    description: 'Base64 编码的 RSA-OAEP-SHA256 管理员密码密文。'
  })
  @IsString({ message: passwordValidation.isString })
  @IsNotEmpty({ message: passwordValidation.isNotEmpty })
  @MaxLength(512, { message: passwordValidation.maxLength(512) })
  @IsBase64({}, { message: '密码密文必须是 Base64 字符串' })
  password!: string;

  @ApiPropertyOptional({
    type: Boolean,
    default: false,
    example: false,
    description: '是否创建为超级管理员。'
  })
  @IsOptional()
  @IsBoolean({ message: isSuperAdminValidation.isBoolean })
  isSuperAdmin?: boolean;

  @ApiPropertyOptional({
    type: String,
    maxLength: 512,
    example: 'Base64-RSA-OAEP-SHA256-ciphertext',
    description: '创建超级管理员时必填的 Base64 RSA-OAEP-SHA256 当前密码密文。'
  })
  @IsOptional()
  @IsString({ message: currentPasswordValidation.isString })
  @MaxLength(512, { message: currentPasswordValidation.maxLength(512) })
  @IsBase64({}, { message: '当前密码密文必须是 Base64 字符串' })
  currentPassword?: string;
}

/** 更新管理员请求。 */
export class AdminUpdateRequestDto {
  @ApiProperty({ type: String, example: '1', description: '待更新管理员 ID。' })
  @IsString({ message: idValidation.isString })
  @IsNotEmpty({ message: idValidation.isNotEmpty })
  id!: string;

  @ApiPropertyOptional({
    type: String,
    minLength: 3,
    maxLength: 64,
    example: 'operator01',
    description: '新的登录用户名。'
  })
  @IsOptional()
  @IsString({ message: usernameValidation.isString })
  @MinLength(3, { message: usernameValidation.minLength(3) })
  @MaxLength(64, { message: usernameValidation.maxLength(64) })
  @Matches(/^[A-Za-z0-9._-]+$/, { message: '用户名格式不正确' })
  username?: string;

  @ApiPropertyOptional({
    type: String,
    maxLength: 512,
    example: 'Base64-RSA-OAEP-SHA256-ciphertext',
    description: '新的 Base64 RSA-OAEP-SHA256 登录密码密文。'
  })
  @IsOptional()
  @IsString({ message: passwordValidation.isString })
  @MaxLength(512, { message: passwordValidation.maxLength(512) })
  @IsBase64({}, { message: '密码密文必须是 Base64 字符串' })
  password?: string;

  @ApiPropertyOptional({
    type: Boolean,
    example: true,
    description: '是否允许该管理员继续登录。'
  })
  @IsOptional()
  @IsBoolean({ message: isActiveValidation.isBoolean })
  isActive?: boolean;

  @ApiPropertyOptional({
    type: Boolean,
    example: false,
    description: '是否设置为超级管理员。'
  })
  @IsOptional()
  @IsBoolean({ message: isSuperAdminValidation.isBoolean })
  isSuperAdmin?: boolean;

  @ApiPropertyOptional({
    type: String,
    maxLength: 512,
    example: 'Base64-RSA-OAEP-SHA256-ciphertext',
    description: '修改密码或超级管理员状态时必填的 Base64 RSA-OAEP-SHA256 当前密码密文。'
  })
  @IsOptional()
  @IsString({ message: currentPasswordValidation.isString })
  @MaxLength(512, { message: currentPasswordValidation.maxLength(512) })
  @IsBase64({}, { message: '当前密码密文必须是 Base64 字符串' })
  currentPassword?: string;
}

/** 重置管理员密码请求。 */
export class AdminResetPasswordRequestDto {
  @ApiProperty({ type: String, example: '2', description: '待重置管理员 ID。' })
  @IsString({ message: idValidation.isString })
  @IsNotEmpty({ message: idValidation.isNotEmpty })
  id!: string;

  @ApiProperty({
    type: String,
    maxLength: 512,
    example: 'Base64-RSA-OAEP-SHA256-ciphertext',
    description: '新的 Base64 RSA-OAEP-SHA256 密码密文。'
  })
  @IsString({ message: passwordValidation.isString })
  @IsNotEmpty({ message: passwordValidation.isNotEmpty })
  @MaxLength(512, { message: passwordValidation.maxLength(512) })
  @IsBase64({}, { message: '密码密文必须是 Base64 字符串' })
  password!: string;

  @ApiProperty({
    type: String,
    maxLength: 512,
    example: 'Base64-RSA-OAEP-SHA256-ciphertext',
    description: 'Base64 RSA-OAEP-SHA256 当前登录管理员密码密文。'
  })
  @IsString({ message: currentPasswordValidation.isString })
  @IsNotEmpty({ message: currentPasswordValidation.isNotEmpty })
  @MaxLength(512, { message: currentPasswordValidation.maxLength(512) })
  @IsBase64({}, { message: '当前密码密文必须是 Base64 字符串' })
  currentPassword!: string;
}

/** 删除管理员请求。 */
export class AdminSoftDeleteRequestDto {
  @ApiProperty({ type: String, example: '1', description: '待删除管理员 ID。' })
  @IsString({ message: idValidation.isString })
  @IsNotEmpty({ message: idValidation.isNotEmpty })
  id!: string;

  @ApiPropertyOptional({
    type: String,
    maxLength: 512,
    example: 'Base64-RSA-OAEP-SHA256-ciphertext',
    description: 'Base64 RSA-OAEP-SHA256 当前登录管理员密码密文。'
  })
  @IsOptional()
  @IsString({ message: currentPasswordValidation.isString })
  @MaxLength(512, { message: currentPasswordValidation.maxLength(512) })
  @IsBase64({}, { message: '当前密码密文必须是 Base64 字符串' })
  currentPassword?: string;
}

/** 管理员角色绑定请求。 */
export class AdminRoleBindingRequestDto {
  @ApiProperty({ type: String, example: '2', description: '管理员 ID。' })
  @IsString({ message: adminIdValidation.isString })
  @IsNotEmpty({ message: adminIdValidation.isNotEmpty })
  adminId!: string;

  @ApiProperty({ type: String, example: '1', description: '角色 ID。' })
  @IsString({ message: roleIdValidation.isString })
  @IsNotEmpty({ message: roleIdValidation.isNotEmpty })
  roleId!: string;
}
