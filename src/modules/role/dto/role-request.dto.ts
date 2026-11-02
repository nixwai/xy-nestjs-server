import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { createValidationMessages } from '#/common/constants/index.js';
import { IsBoolean, IsNotEmpty, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

const codeValidation = createValidationMessages('角色编码');
const nameValidation = createValidationMessages('角色名称');
const descriptionValidation = createValidationMessages('角色描述');
const idValidation = createValidationMessages('ID');
const isActiveValidation = createValidationMessages('启用状态');
const roleIdValidation = createValidationMessages('角色 ID');
const permissionIdValidation = createValidationMessages('权限 ID');

/** 创建角色请求。 */
export class RoleCreateRequestDto {
  @ApiProperty({
    type: String,
    maxLength: 64,
    example: 'operator',
    description: '角色唯一编码，只允许小写字母、数字、冒号、下划线和连字符。'
  })
  @IsString({ message: codeValidation.isString })
  @IsNotEmpty({ message: codeValidation.isNotEmpty })
  @MaxLength(64, { message: codeValidation.maxLength(64) })
  @Matches(/^[a-z][a-z0-9:_-]+$/, { message: '角色编码格式不正确' })
  code!: string;

  @ApiProperty({
    type: String,
    maxLength: 128,
    example: '运营人员',
    description: '角色名称。'
  })
  @IsString({ message: nameValidation.isString })
  @IsNotEmpty({ message: nameValidation.isNotEmpty })
  @MaxLength(128, { message: nameValidation.maxLength(128) })
  name!: string;

  @ApiPropertyOptional({
    type: String,
    maxLength: 255,
    example: '负责日常运营管理。',
    description: '角色描述。'
  })
  @IsOptional()
  @IsString({ message: descriptionValidation.isString })
  @MaxLength(255, { message: descriptionValidation.maxLength(255) })
  description?: string;
}

/** 更新角色请求。 */
export class RoleUpdateRequestDto {
  @ApiProperty({ type: String, example: '1', description: '待更新角色 ID。' })
  @IsString({ message: idValidation.isString })
  @IsNotEmpty({ message: idValidation.isNotEmpty })
  id!: string;

  @ApiPropertyOptional({
    type: String,
    maxLength: 128,
    example: '运营人员',
    description: '新的角色名称。'
  })
  @IsOptional()
  @IsString({ message: nameValidation.isString })
  @IsNotEmpty({ message: nameValidation.isNotEmpty })
  @MaxLength(128, { message: nameValidation.maxLength(128) })
  name?: string;

  @ApiPropertyOptional({
    type: String,
    maxLength: 255,
    example: '负责日常运营管理。',
    description: '新的角色描述。'
  })
  @IsOptional()
  @IsString({ message: descriptionValidation.isString })
  @MaxLength(255, { message: descriptionValidation.maxLength(255) })
  description?: string;

  @ApiPropertyOptional({
    type: Boolean,
    example: true,
    description: '是否启用该角色。'
  })
  @IsOptional()
  @IsBoolean({ message: isActiveValidation.isBoolean })
  isActive?: boolean;
}

/** 软删除角色请求。 */
export class RoleSoftDeleteRequestDto {
  @ApiProperty({ type: String, example: '1', description: '待删除角色 ID。' })
  @IsString({ message: idValidation.isString })
  @IsNotEmpty({ message: idValidation.isNotEmpty })
  id!: string;
}

/** 角色权限绑定请求。 */
export class RolePermissionBindingRequestDto {
  @ApiProperty({ type: String, example: '1', description: '角色 ID。' })
  @IsString({ message: roleIdValidation.isString })
  @IsNotEmpty({ message: roleIdValidation.isNotEmpty })
  roleId!: string;

  @ApiProperty({ type: String, example: '1', description: '权限 ID。' })
  @IsString({ message: permissionIdValidation.isString })
  @IsNotEmpty({ message: permissionIdValidation.isNotEmpty })
  permissionId!: string;
}
