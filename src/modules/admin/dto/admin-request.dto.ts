import { Type } from 'class-transformer';
import { createValidationMessages } from '../../../common/constants/index.js';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

const pageValidation = createValidationMessages('页码');
const pageSizeValidation = createValidationMessages('每页条数');
const usernameValidation = createValidationMessages('用户名');
const passwordValidation = createValidationMessages('密码');
const currentPasswordValidation = createValidationMessages('当前密码');
const idValidation = createValidationMessages('ID');
const adminIdValidation = createValidationMessages('管理员 ID');
const roleIdValidation = createValidationMessages('角色 ID');
const isActiveValidation = createValidationMessages('启用状态');
const isSuperAdminValidation = createValidationMessages('超级管理员标识');

/** 分页查询参数。 */
export class AdminListQueryDto {
  @ApiPropertyOptional({
    type: Number,
    default: 1,
    minimum: 1,
    description: '页码，从 1 开始。',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: pageValidation.isInt })
  @Min(1, { message: pageValidation.min(1) })
  page = 1;

  @ApiPropertyOptional({
    type: Number,
    default: 20,
    minimum: 1,
    maximum: 100,
    description: '每页条数，范围 1-100。',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: pageSizeValidation.isInt })
  @Min(1, { message: pageSizeValidation.min(1) })
  @Max(100, { message: pageSizeValidation.max(100) })
  pageSize = 20;
}

/** 创建管理员请求。 */
export class AdminCreateRequestDto {
  @ApiProperty({
    type: String,
    minLength: 3,
    maxLength: 64,
    example: 'operator01',
    description: '管理员登录用户名，只允许字母、数字、点、下划线和连字符。',
  })
  @IsString({ message: usernameValidation.isString })
  @IsNotEmpty({ message: usernameValidation.isNotEmpty })
  @MinLength(3, { message: usernameValidation.minLength(3) })
  @MaxLength(64, { message: usernameValidation.maxLength(64) })
  @Matches(/^[A-Za-z0-9._-]+$/, { message: '用户名格式不正确' })
  username!: string;

  @ApiProperty({
    type: String,
    minLength: 8,
    maxLength: 72,
    example: 'Admin1234',
    description: '管理员登录密码，至少包含字母和数字。',
  })
  @IsString({ message: passwordValidation.isString })
  @MinLength(8, { message: passwordValidation.minLength(8) })
  @MaxLength(72, { message: passwordValidation.maxLength(72) })
  @Matches(/^(?=.*[A-Za-z])(?=.*\d).+$/, {
    message: '密码必须同时包含字母和数字',
  })
  password!: string;

  @ApiPropertyOptional({
    type: Boolean,
    default: false,
    example: false,
    description: '是否创建为超级管理员。',
  })
  @IsOptional()
  @IsBoolean({ message: isSuperAdminValidation.isBoolean })
  isSuperAdmin?: boolean;

  @ApiPropertyOptional({
    type: String,
    minLength: 8,
    maxLength: 72,
    example: 'Current1234',
    description: '创建超级管理员时必填的当前登录管理员密码。',
  })
  @IsOptional()
  @IsString({ message: currentPasswordValidation.isString })
  @MinLength(8, { message: currentPasswordValidation.minLength(8) })
  @MaxLength(72, { message: currentPasswordValidation.maxLength(72) })
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
    description: '新的登录用户名。',
  })
  @IsOptional()
  @IsString({ message: usernameValidation.isString })
  @MinLength(3, { message: usernameValidation.minLength(3) })
  @MaxLength(64, { message: usernameValidation.maxLength(64) })
  @Matches(/^[A-Za-z0-9._-]+$/, { message: '用户名格式不正确' })
  username?: string;

  @ApiPropertyOptional({
    type: String,
    minLength: 8,
    maxLength: 72,
    example: 'NewAdmin1234',
    description: '新的登录密码，至少包含字母和数字。',
  })
  @IsOptional()
  @IsString({ message: passwordValidation.isString })
  @MinLength(8, { message: passwordValidation.minLength(8) })
  @MaxLength(72, { message: passwordValidation.maxLength(72) })
  @Matches(/^(?=.*[A-Za-z])(?=.*\d).+$/, {
    message: '密码必须同时包含字母和数字',
  })
  password?: string;

  @ApiPropertyOptional({
    type: Boolean,
    example: true,
    description: '是否允许该管理员继续登录。',
  })
  @IsOptional()
  @IsBoolean({ message: isActiveValidation.isBoolean })
  isActive?: boolean;

  @ApiPropertyOptional({
    type: Boolean,
    example: false,
    description: '是否设置为超级管理员。',
  })
  @IsOptional()
  @IsBoolean({ message: isSuperAdminValidation.isBoolean })
  isSuperAdmin?: boolean;

  @ApiPropertyOptional({
    type: String,
    minLength: 8,
    maxLength: 72,
    example: 'Current1234',
    description: '修改密码或超级管理员状态时必填的当前登录管理员密码。',
  })
  @IsOptional()
  @IsString({ message: currentPasswordValidation.isString })
  @MinLength(8, { message: currentPasswordValidation.minLength(8) })
  @MaxLength(72, { message: currentPasswordValidation.maxLength(72) })
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
    minLength: 8,
    maxLength: 72,
    example: 'NewAdmin1234',
    description: '新密码，至少包含字母和数字。',
  })
  @IsString({ message: passwordValidation.isString })
  @MinLength(8, { message: passwordValidation.minLength(8) })
  @MaxLength(72, { message: passwordValidation.maxLength(72) })
  @Matches(/^(?=.*[A-Za-z])(?=.*\d).+$/, {
    message: '密码必须同时包含字母和数字',
  })
  password!: string;

  @ApiProperty({
    type: String,
    minLength: 8,
    maxLength: 72,
    example: 'Current1234',
    description: '当前登录管理员密码。',
  })
  @IsString({ message: currentPasswordValidation.isString })
  @MinLength(8, { message: currentPasswordValidation.minLength(8) })
  @MaxLength(72, { message: currentPasswordValidation.maxLength(72) })
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
    minLength: 8,
    maxLength: 72,
    example: 'Current1234',
    description: '当前登录管理员密码。',
  })
  @IsOptional()
  @IsString({ message: currentPasswordValidation.isString })
  @MinLength(8, { message: currentPasswordValidation.minLength(8) })
  @MaxLength(72, { message: currentPasswordValidation.maxLength(72) })
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
